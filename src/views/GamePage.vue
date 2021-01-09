<template>
    <div class="game-page">
        <div class="game-page-container">
            <div class="texture-alum"></div>
        <div 
            id="gameCanvas" 
            ref="gameCanvas" 
            tabindex="1"
            @keydown.w="wPressed = true"
            @keydown.d="dPressed = true"
            @keydown.s="sPressed = true"
            @keydown.a="aPressed = true"
            @keyup.w="wPressed = false"
            @keyup.d="dPressed = false"
            @keyup.s="sPressed = false"
            @keyup.a="aPressed = false"
            @mousedown.left="leftMouseButtonPressed = true"
            @mouseup.left="leftMouseButtonPressed = false">
            <div class="lines"></div>
            <div class="timer" v-if="timer">{{ timer }}</div>
            <div class="respawning" ref="respawning">You're terrible. <br> Prepare to Respawn...</div>
        </div>
        </div>
    </div>
</template>

<script>

import { request, cancelToken } from './../helpers/request';
import * as PIXI from 'pixi.js';
import GameLoop from 'mainloop.js';
import Impetus from '../helpers/impetus';
import io from 'socket.io-client';
import moment from 'moment';
import Vuex from 'vuex'

export default {
    
    /**
     * Data
     */
    data: function () {
        return {
            requestLobbyCancelToken: cancelToken(),
            lobby: null,
            impetus: null,
            game: null,
            gameSize: { w: 720, h: 576 },
            gameRatio: 576 / 720,
            wPressed: false,
            dPressed: false,
            sPressed: false,
            aPressed: false,
            leftMouseButtonPressed: false,
            
            // World properties
            timer: null,
            respawning: false,

        }
    },

    /**
     * Add the window resize event on element create.
     */
    created: function () {
        window.addEventListener("resize", this.resizeHandler);
    },

    /**
     * Called before the component is destroyed
     */
    beforeDestroy: function () {
        if (this.socket != null) {
            this.socket.disconnect();
        }
    },

    /**
     * When the element is destroyed, remove the
     * window resize event listener.
     */
    destroyed: function () {
        window.removeEventListener("resize", this.resizeHandler);
    },

    /**
     * On component mounted
     */
    mounted: function () {

        // Show loader
        this.$store.commit('showLoader', "Joining lobby...");

        // Make sure game lobby still exists
        request({
            method: 'get',
            url: 'games/' + this.$route.params.id,
            cancelToken: this.requestLobbyCancelToken.token
        }).then((res) => {

            // Set lobby data
            this.lobby = res.json.data;

            // If lobby has finished, kick user out
            if (moment().isAfter(res.json.data.gameEndDatetime)) {
                alert('Sorry, this lobby no longer exists. We will redirect you to the dashboard.');
                this.$store.commit('hideLoader');
                this.$router.push('/dashboard/lobbies');
            }

            // The lobby does exist, now load pixi.js and assets
            this.$store.commit('showLoader', "Loading assets...");
            
            // Create game
            this.game = new PIXI.Application({
                width: this.gameSize.w, 
                height: this.gameSize.h,
                antialias: true,  
                transparent: false, 
                resolution: 1 
            });

            // Renderer options
            this.game.renderer.backgroundColor = 0x000000;
            this.game.renderer.autoResize = false;
            this.game.renderer.resize(this.gameSize.w, this.gameSize.h);

            // Add view to screen
            this.$refs.gameCanvas.append(this.game.view);
            this.$refs.gameCanvas.focus();


            // Set canvas height to fit 16:9 aspect ratio
            this.resizeHandler();


            // Load assets
            this.game.loader.reset()
            .add('soldier', require('../assets/soldier.png'))
            .add('enemySoldier', require('../assets/enemySoldier.png'))
            .add('bullet', require('../assets/bullet.png'))
            .add('map', this.lobby.gameMap.mapTexturePath)
            .load(this.onAssetsReady);

            
        }).catch((err) => {
            alert('Sorry, this lobby no longer exists. We will redirect you to the dashboard');
            this.$store.commit('hideLoader');
            this.$router.push('/dashboard/lobbies');
            console.log(err);
        });
        
    },

    

    /**
     * Methods
     */
    methods: {

        /**
         * Assets have been loaded so now connect to socket
         */
        onAssetsReady: function () {

            var player = {};
            var opponentPlayers = [];

            // Connect using web sockets
            this.socket = io.connect(process.env.VUE_APP_API_BASE_URL, {
                forceNew: true,
                query: {
                    jwt: window.localStorage.getItem('JWT'),
                    lobbyId: this.$route.params.id,
                }
            });
            
            // User is successfully connected and ready to go
            this.socket.on('connect', () => {

                // Listen to ready event
                this.socket.on('worldReady', (data) => {

                    // Create pixi world
                    const WORLD = new PIXI.Container();
                    const WORLD_SIZE = { w: data.worldWidth, h: data.worldHeight };
                    const WORLD_SPRITE = new PIXI.Sprite(this.game.loader.resources["map"].texture);
                    WORLD.width = WORLD_SIZE.w;
                    WORLD.height = WORLD_SIZE.h;
                    WORLD_SPRITE.width = WORLD_SIZE.w;
                    WORLD_SPRITE.height = WORLD_SIZE.h;
                    WORLD.addChild(WORLD_SPRITE);
                    this.game.stage.addChild(WORLD);

                    // Get id of current user
                    var userId = window.localStorage.getItem("userId");
                    var userRespawning = false;

                    // Sprite references
                    var playerSprites = {};

                    // Listen to tick event
                    this.socket.on('tick', (data) => {

                        // Iterate through all players in world
                        for (var i = 0; i < data.players.length; i++) {

                            if (!data.players[i])
                                continue;

                            // If this sprite doesn't exist, create it
                            if (!playerSprites[data.players[i].id]) {
                                if (data.players[i].id == userId) {
                                    playerSprites[data.players[i].id] = new PIXI.Sprite(this.game.loader.resources["soldier"].texture);
                                } else {
                                    playerSprites[data.players[i].id] = new PIXI.Sprite(this.game.loader.resources["enemySoldier"].texture);
                                }
                                playerSprites[data.players[i].id].anchor.set(0.5, 0.5);
                                playerSprites[data.players[i].id].width = 40;
                                playerSprites[data.players[i].id].height = 40;
                                const textSprite = new PIXI.Text(data.players[i].health, new PIXI.TextStyle({ fontSize: 18, fill: "red" }));
                                textSprite.position.set(0, 0);
                                textSprite.anchor.set(0.5, 0.5);
                                playerSprites[data.players[i].id].addChild(textSprite);
                                WORLD.addChild(playerSprites[data.players[i].id]);
                            }

                            // If current player is dead hide sprite
                            if (data.players[i].dead) {
                                if (data.players[i].id == userId) {
                                    userRespawning = true;
                                }
                                playerSprites[data.players[i].id].visible = false;
                                continue; 
                            } else {
                                if (data.players[i].id == userId) {
                                    userRespawning = false;
                                }
                                playerSprites[data.players[i].id].visible = true;
                            }

                            // If is current player, move world
                            if (data.players[i].id == userId) {
                                WORLD.position.x = (this.gameSize.w - data.players[i].position.x) - (this.gameSize.w / 2);
                                WORLD.position.y = (this.gameSize.h - data.players[i].position.y) - (this.gameSize.h / 2);
                            } 

                            // Move and rotate player
                            playerSprites[data.players[i].id].rotation = data.players[i].angle;
                            playerSprites[data.players[i].id].position.set(data.players[i].position.x, data.players[i].position.y);
                            playerSprites[data.players[i].id].children[0].text = data.players[i].health;

                            // Show red tint if player has recently been hit
                            if (data.players[i].hitTimer < 10) {
                                playerSprites[data.players[i].id].tint = "0xff0000";
                            } else {
                                playerSprites[data.players[i].id].tint = "0xffffff";
                            }
                           

                        }

                        // Remove sprites whose players have left
                        for (var playerId in playerSprites) {
                            var isStillInGame = false;
                            for (var i = 0; i < data.players.length; i++) {
                                if (data.players[i].id == playerId) {
                                    isStillInGame = true;
                                    break;
                                }
                            }
                            if (!isStillInGame) {
                                WORLD.removeChild(playerSprites[playerId]);
                                playerSprites[playerId] = null;
                                delete playerSprites[playerId];
                            }
                        }

                        // Send updates back
                        if (!userRespawning) {
                            this.socket.emit('playerUpdate', {
                                deltaX: (this.aPressed ? 1 : 0) + (this.dPressed ? -1  : 0),
                                deltaY: (this.wPressed ? 1 : 0) + (this.sPressed ? -1  : 0),
                                angle: Math.atan2(this.game.renderer.plugins.interaction.mouse.global.y - this.gameSize.h / 2, this.game.renderer.plugins.interaction.mouse.global.x - this.gameSize.w / 2),
                                shooting: this.leftMouseButtonPressed
                            });
                        }

                        if (userRespawning) {
                            this.$refs.respawning.style.visibility = 'visible';
                        } else {
                            this.$refs.respawning.style.visibility = 'hidden';
                        }
                        


                    });

                   /* GameLoop.setUpdate((delta) => {

                        // Move character
                        var deltaX = (this.aPressed ? 1 : 0) + (this.dPressed ? -1  : 0);
                        var deltaY = (this.wPressed ? 1 : 0) + (this.sPressed ? -1  : 0);
                        var mouseX = this.game.renderer.plugins.interaction.mouse.global.x;
                        var mouseY = this.game.renderer.plugins.interaction.mouse.global.y;
                        //var angle = Math.atan2(mouseY - characterSprite.position.y, mouseX - characterSprite.position.x);
                        this.socket.emit('move', {
                            deltaX: deltaX,
                            deltaY: deltaY,
                            angle: 0,
                        });

                    }).start();*/




                
                    // Create a new vue store for handling data
                    /*const WorldModel = new Vuex.Store({
                        state: {
                            worldWidth: model.worldWidth,
                            worldHeight: model.worldHeight,
                            players: model.players,
                        },
                        mutations: {
                            addPlayer (state, player) {
                                state.players.push(player);
                            },
                            removePlayer (state, playerId) {
                                state.players = state.filters.filter((player) => {
                                    return player.id != playerId;
                                });
                            }
                        },
                        actions: {
                        },
                        getters: {
                            worldWidth: (state) => {
                                return state.worldHeight;
                            },
                            worldHeight: (state) => {
                                return state.worldHeight;
                            },
                            players: (state) => {
                                return state.players;
                            },
                            player: (state) => (playerId) => {
                                return state.players.find(player => player.id === playerId);
                            },
                            playerOpponents: (state) => (playerId) => {
                                return state.players.filter(player => player.id !== playerId)
                            }
                        }
                    });

                    // Get main player
                    console.group();
                    console.log(WorldModel.getters.player(window.localStorage.getItem("userId")));
                    console.log(WorldModel.getters.players);
                    console.log(WorldModel.getters.playerOpponents(window.localStorage.getItem("userId")));
                    console.groupEnd();

                    return;*/





                    player = data.player;
                    opponentPlayers = data.opponentPlayers;




                    // Now we can set up PIXI
                    /*const WORLD = new PIXI.Container();
                    const WORLD_SIZE = { w: data.worldWidth, h: data.worldHeight };
                    const WORLD_SPRITE = new PIXI.Sprite(this.game.loader.resources["map"].texture);
                    WORLD.width = WORLD_SIZE.w;
                    WORLD.height = WORLD_SIZE.h;
                    WORLD.position.x = 0 + (this.gameSize.w / 2);
                    WORLD.position.y = 0 + (this.gameSize.h / 2);
                    WORLD_SPRITE.width = WORLD_SIZE.w;
                    WORLD_SPRITE.height = WORLD_SIZE.h;
                    WORLD_SPRITE.position.x = 0;
                    WORLD_SPRITE.position.y = 0;
                    WORLD.addChild(WORLD_SPRITE);
                    this.game.stage.addChild(WORLD);*/

                    /*// Render player
                    const characterSprite = new PIXI.Sprite(this.game.loader.resources["soldier"].texture);
                    characterSprite.position.set(this.gameSize.w / 2, this.gameSize.h / 2);
                    characterSprite.anchor.set(0.5, 0.5);
                    characterSprite.width = 60;
                    characterSprite.height = 60;
                    this.game.stage.addChild(characterSprite);

                    const message = new PIXI.Text(player.displayName, new PIXI.TextStyle({ fontSize: 12, fill: "white" }));
                    message.position.set(characterSprite.position.x, characterSprite.position.y - 30);
                    message.anchor.set(0.5, 0.5);
                    this.game.stage.addChild(message);

                    
                    for (var i = 0; i < opponentPlayers.length; i++) {
                        const sprite = new PIXI.Sprite(this.game.loader.resources["soldier"].texture);
                        sprite.position.set(opponentPlayers[i].position.x, opponentPlayers[i].position.y);
                        sprite.anchor.set(0.5, 0.5);
                        sprite.width = 60;
                        sprite.height = 60;
                        const textSprite = new PIXI.Text(opponentPlayers[i].displayName, new PIXI.TextStyle({ fontSize: 12, fill: "red" }));
                        textSprite.position.set(opponentPlayers[i].position.x, opponentPlayers[i].position.y - 30);
                        textSprite.anchor.set(0.5, 0.5);
                        WORLD.addChild(textSprite);
                        WORLD.addChild(sprite);
                        opponentPlayers[i].sprite = sprite;
                        opponentPlayers[i].textSprite = textSprite;
                    }

                    // Game loop
                    GameLoop.setUpdate((delta) => {

                        // Move character
                        var deltaX = (this.aPressed ? 1 : 0) + (this.dPressed ? -1  : 0);
                        var deltaY = (this.wPressed ? 1 : 0) + (this.sPressed ? -1  : 0);
                        var mouseX = this.game.renderer.plugins.interaction.mouse.global.x;
                        var mouseY = this.game.renderer.plugins.interaction.mouse.global.y;
                        var angle = Math.atan2(mouseY - characterSprite.position.y, mouseX - characterSprite.position.x);
                        this.socket.emit('move', {
                            deltaX: deltaX,
                            deltaY: deltaY,
                            angle: angle,
                        });

                    }).start();
                        
                    // Call player move command instantly
                    this.socket.emit('move', {
                        deltaX: 0,
                        deltaY: 0,
                        angle: 0,
                    });

                    // On player move callback
                    this.socket.on('playerMove', (data) => {
                        WORLD.position.x = (this.gameSize.w - data.position.x) - (this.gameSize.w / 2);
                        WORLD.position.y = (this.gameSize.h - data.position.y) - (this.gameSize.h / 2);
                        characterSprite.rotation = data.angle;
                    });


                    this.socket.on('opponentPlayerMove',function(data) {
                        for (var i = 0; i < opponentPlayers.length; i++) {
                            if (opponentPlayers[i].id == data.id) {
                                opponentPlayers[i].sprite.position.set(data.position.x, data.position.y);
                                opponentPlayers[i].textSprite.position.set(data.position.x, data.position.y - 30);
                                opponentPlayers[i].sprite.rotation = data.angle;
                                return;
                            }
                        }
                    });


                    this.socket.on('opponentPlayerJoin', (data) => {
                        const sprite = new PIXI.Sprite(this.game.loader.resources["soldier"].texture);
                        sprite.position.set(data.position.x, data.position.y);
                        sprite.anchor.set(0.5, 0.5);
                        sprite.width = 60;
                        sprite.height = 60;
                        const textSprite = new PIXI.Text(data.displayName, new PIXI.TextStyle({ fontSize: 12, fill: "red" }));
                        textSprite.position.set(data.position.x, data.position.y - 30);
                        textSprite.anchor.set(0.5, 0.5);
                        WORLD.addChild(textSprite);
                        WORLD.addChild(sprite);
                        data.sprite = sprite;
                        data.textSprite = textSprite;
                        opponentPlayers.push(data);
                    });

                    this.socket.on('opponentPlayerLeave', (data) => {
                        opponentPlayers = opponentPlayers.filter((p) => {
                            if (p.id == data.id) {
                                WORLD.removeChild(p.sprite);
                                WORLD.removeChild(p.textSprite);
                                return false;
                            } else {
                                return true;
                            }
                        });
                        console.log(opponentPlayers);
                    });*/

                    // Hide loader
                    this.$store.commit('hideLoader');
                });
                
               
                

            });
            
            // On connection error, probably unauthorized
            this.socket.on('connect_error', (err) => {

                // JWT error
                if (err.message == "Invalid token") {
                    alert('Sorry, you are unauthoized. Please log in.');
                    window.localStorage.removeItem('JWT');
                    window.localStorage.removeItem('userId');
                    this.$router.push('/');
                }

                // Does not exist
                else if (err.message == "The lobby does not exist") {
                    alert('Sorry, this lobby no longer exists. We will redirect you to the dashboard.');
                    this.$router.push('/dashboard/lobbies');
                }

                // General error
                else {
                    alert('Sorry, there was an error. We will redirect you to the dashboard.');
                    this.$router.push('/dashboard/lobbies');
                }

            });

        },


        /**
         * Handle screen resize
         */
        resizeHandler(e) {
            this.$refs.gameCanvas.style.height = (this.$refs.gameCanvas.offsetWidth * this.gameRatio) + "px";
        }

    }
 
}
</script>

<style lang="scss">
    @import '../scss/variables.scss';

    .game-page {
        position: relative;
        display: block;
        width: 100%;
        height: 100%;
        font-size: 0px;
        text-align: center;

        &::before {
            content:"";
            position: relative;
            display: inline-block;
            vertical-align: middle;
            width:0px;
            height: 100%;
            z-index: 2;
        }

        .game-page-container {
            position: relative;
            display: inline-block;
            vertical-align: middle;
            width: 720px;
            height: 576px;
            max-height:calc(100% - 60px);
            background-color: #FFF;
            border-radius: 5px;
            overflow: hidden;
            box-shadow: $shadow-card-2;
            transition: all 0.3s cubic-bezier(.25,.8,.25,1);
            z-index: 2;

            #gameCanvas {
                position: relative;
                float: left;
                width: 100%;
                height: 100%;
                //max-width: 720px;
                //max-height: 576px;
                overflow: hidden;
                cursor: url("~@/assets/crosshair.png") 16 16, auto;
                z-index: 10;
                background-color: black;

                canvas {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%!important;
                    height: 100%!important;
                }
            }

            .timer {
                position: absolute;
                top: 0;
                left: 0;
                width: 200px;
                height: 100px;
                z-index: 101;
                pointer-events: none;
                font-size: 12px;
                color: #FFF;
            }

            
            .respawning {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                padding-top: 220px;
                z-index: 101;
                pointer-events: none;
                font-size: 12px;
                color: #FFF;
                background-color:rgba(0,0,0,0.5);
            }

            .lines {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 100;
                pointer-events: none;
                display: none;

                &::before {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: calc(50% - 1px);
                    width: 2px;
                    height: 100%;
                    background-color: yellow;
                }
                
                &::after {
                    content: "";
                    position: absolute;
                    left: 0;
                    top: calc(50% - 1px);
                    height: 2px;
                    width: 100%;
                    background-color: yellow;
                }
            }
        
        }
    }

</style>