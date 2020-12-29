<template>
    <div class="home-page">
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
            @keyup.a="aPressed = false">
            <div class="lines"></div>
        </div>
    </div>
</template>

<script>

import * as PIXI from 'pixi.js';
import GameLoop from 'mainloop.js';
import Impetus from '../helpers/impetus';
import io from 'socket.io-client';
import randomName from 'random-name';

export default {
    
    /**
     * Data
     */
    data: function () {
        return {
            impetus: null,
            game: null,
            gameSize: { w: 720, h: 576 },
            gameRatio: 576 / 720,
            wPressed: false,
            dPressed: false,
            sPressed: false,
            aPressed: false,
            playerSpeed: 3
        }
    },

    /**
     * Add the window resize event on element create.
     */
    created: function () {
        window.addEventListener("resize", this.resizeHandler);
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
        .add('image', require('../assets/pathNS.png'))
        .add('soldier', require('../assets/enemySoldier.png'))
        .add('map', require('../assets/map.png'))
        .load(this.afterSetup);
    },



    methods: {

        afterSetup: function () {

            
            const name = randomName.first();
            const socket = io.connect('http://localhost:8080/player', {'forceNew': true});
            socket.on('connect', () => {
                
                socket.emit('joinGame', {
                    name: name,
                });


                const WORLD = new PIXI.Container();
                const WORLD_SIZE = { w: 900, h: 1200 };
                const WORLD_SPRITE = new PIXI.Sprite(this.game.loader.resources["map"].texture);

                WORLD.width = WORLD_SIZE.w;
                WORLD.height = WORLD_SIZE.h;
                WORLD.position.x = (this.gameSize.w - WORLD_SIZE.w) / 2;
                WORLD.position.y = (this.gameSize.h - WORLD_SIZE.h) / 2;
                WORLD_SPRITE.width = WORLD_SIZE.w;
                WORLD_SPRITE.height = WORLD_SIZE.h;
                WORLD_SPRITE.position.x = 0;
                WORLD_SPRITE.position.y = 0;

                WORLD.addChild(WORLD_SPRITE);
                this.game.stage.addChild(WORLD);

                const characterSprite = new PIXI.Sprite(this.game.loader.resources["soldier"].texture);
                characterSprite.position.set(this.gameSize.w / 2, this.gameSize.h / 2);
                characterSprite.anchor.set(0.5, 0.5);
                characterSprite.width = 60;
                characterSprite.height = 60;
                this.game.stage.addChild(characterSprite);

                const randomSprite = new PIXI.Sprite(this.game.loader.resources["soldier"].texture);
                randomSprite.position.set(100, 100);
                randomSprite.anchor.set(0.5, 0.5);
                randomSprite.width = 60;
                randomSprite.height = 60;
                WORLD.addChild(randomSprite);


                const message = new PIXI.Text(name, new PIXI.TextStyle({ fontSize: 18, fill: "white" }));
                message.position.set(characterSprite.position.x, characterSprite.position.y - 30);
                message.anchor.set(0.5, 0.5);
                this.game.stage.addChild(message);

                this.impetus = new Impetus({
                    source: this.game.view,
                    bounce: false,
                    boundX: [-(WORLD_SIZE.w / 2), WORLD_SIZE.w / 2],
                    boundY: [-(WORLD_SIZE.h / 2), WORLD_SIZE.h / 2],
                    update: (x, y) => {
                        WORLD.position.x = (WORLD.width  - this.gameSize.w - Math.abs((this.gameSize.w - WORLD_SIZE.w) / 2) - x) * -1;
                        WORLD.position.y = (WORLD.height - this.gameSize.h - Math.abs((this.gameSize.h - WORLD_SIZE.h) / 2) - y) * -1;
                        
                        const PlayerCoords = {
                            x: Math.abs(WORLD.position.x - (this.gameSize.w / 2)),
                            y: Math.abs(WORLD.position.y - (this.gameSize.h / 2))
                        }
                       
                    }
                });
                this.impetus.pause();

                GameLoop.setUpdate(() => {

                    // Move character
                    var deltaX = (this.aPressed ? 1 : 0) + (this.dPressed ? -1  : 0);
                    var deltaY = (this.wPressed ? 1 : 0) + (this.sPressed ? -1  : 0);
                    if (deltaX != 0 || deltaY != 0) {
                        socket.emit('move', {
                            deltaX: deltaX,
                            deltaY: deltaY
                        });
                        //this.impetus.updateDelta(deltaX, deltaY);
                    }

                    // Point character in correct direction
                    var mouseX = this.game.renderer.plugins.interaction.mouse.global.x;
                    var mouseY = this.game.renderer.plugins.interaction.mouse.global.y;
                    var angle = Math.atan2(mouseY - characterSprite.position.y, mouseX - characterSprite.position.x);
                    characterSprite.rotation = angle;

                }).setDraw(() => {
                    //this.game.renderer.render(this.game.stage);
                }).setEnd((fps) => {

                }).start();

                
                socket.on('playerMove', (data) => {
                    this.impetus.updateDelta(data.deltaX, data.deltaY);
                });

                socket.on('opponentPlayerMove', (data) => {
                    console.log('opponentPlayerMove', data);
                })

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

    .home-page {
        position: relative;
        display: block;
        width: 100%;
        height: 100%;

        #gameCanvas {
            position: relative;
            float: left;
            width: 100%;
            height: 100%;
            max-width: 720px;
            max-height: 576px;
            overflow: hidden;
            cursor: url("~@/assets/crosshair.png") 16 16, auto;

            canvas {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%!important;
                height: 100%!important;
            }
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

</style>