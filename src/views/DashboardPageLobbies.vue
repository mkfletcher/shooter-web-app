<template>
    <div class="lobbies-page d-block h-100">
        <div class="lobbies-page-title-bar">
            <div class="row h-100 no-gutters">
                <div class="col-7 align-self-center text-left px-3">
                    <h5 class="weight-600 m-0">Lobbies</h5>
                </div>
                 <div class="col-5 align-self-center text-right px-3">
                    <b-button variant="outline-danger m-0" :to="`/dashboard/lobbies/create`">CREATE LOBBY</b-button>
                </div>
            </div>
        </div>
        <div class="lobbies-list">
            <div class="lobbies-list-group-title" v-b-toggle.collapse-1>My Lobbies <i class="fas fa-chevron-down"></i></div>
            <b-collapse id="collapse-1" class="mt-2" visible>
                <lobby-card v-for="item in userLobbies" v-bind:key="item._id" :lobby="item"></lobby-card>
                <!--<div class="lobby-card" v-for="item in userLobbies" v-bind:key="item._id">
                    <div class="img" :style="`background-image:url(${item.gameMap.mapTexturePath})`"></div>
                    <div class="content">
                        <h5 class="weight-600 mt-2 mb-1">{{ item.gameMap.mapTitle }}</h5>
                        <h6 class="weight-400 m-0">{{ item.gameMode.gameModeTitle }} · 0 / {{ item.gameMaxPlayers }} Players</h6>
                    </div>
                    <div class="actions text-right">
                        <b-button variant="outline-danger mt-2" :to="`/dashboard/game/${item._id}`">JOIN</b-button>
                    </div>
                </div>-->
            </b-collapse>
            <div class="lobbies-list-group-title" v-b-toggle.collapse-2>Other Lobbies <i class="fas fa-chevron-down"></i></div>
                <b-collapse id="collapse-2" class="mt-2">
                    <div class="lobby-card" v-for="item in otherLobbies" v-bind:key="item._id">
                        <div class="img" :style="`background-image:url(${item.gameMap.mapTexturePath})`"></div>
                        <div class="content">
                            <h5 class="weight-600 mt-2 mb-1">{{ item.gameMap.mapTitle }}</h5>
                            <h6 class="weight-400 m-0">{{ item.gameMode.gameModeTitle }} · 0 / {{ item.gameMaxPlayers }} Players</h6>
                        </div>
                        <div class="actions text-right">
                            <b-button variant="outline-danger mt-2" :to="`/dashboard/game/${item._id}`">JOIN</b-button>
                        </div>
                    </div>
                </b-collapse>
        </div>
    </div>
</template>
<script>
	import { request, cancelToken } from './../helpers/request';

    export default {
        data: function () {
            return {
                userLobbies: [],
                otherLobbies: [],
                requestLobbiesCancelToken: cancelToken()
            };
        },
        mounted: async function () {

            // Is now loading lobbies
            this.$store.commit('showLoader', "Loading lobbies...");

            // Get maps
            setTimeout(() => {
                request({
                    method: 'get',
                    url: 'games',
                    cancelToken: this.requestLobbiesCancelToken.token
                }).then((res) => {
                    this.userLobbies = res.json.data.filter((lobby) => {
                        return lobby.gameUser == window.localStorage.getItem('userId');
                    });
                    this.otherLobbies = res.json.data.filter((lobby) => {
                        return lobby.gameUser != window.localStorage.getItem('userId');
                    });
                }).catch((err) => {
                    console.log(err);
                }).finally(() => {
                    this.$store.commit('hideLoader');
                });
            }, 500);

        },

        destroyed: function () {
            this.requestLobbiesCancelToken.cancel('Request Cancelled');
        },
        computed: {
           
        },
        methods: {
            
        }
    }
</script>
<style lang="scss" scoped>
   
    .lobbies-page {

        .lobbies-page-title-bar {
            position: relative;
            display: block;
            width: 100%;
            height: 52px;
            background-color: #FFF;
        }

        .lobbies-list {
            position: relative;
            display: block;
            width: 100%;
            height: calc(100% - 52px);
            padding: 12px;
            overflow-y: auto;
            overflow-x: hidden;

            .lobbies-list-group-title {
                outline: none!important;
                
                i {
                    transition: transform 200ms;
                    transform-origin: 50% 50%;
                }
                &.collapsed {

                    i {
                        transform: rotate(-180deg);
                    }
                }
            }

            
        }
    }

</style>