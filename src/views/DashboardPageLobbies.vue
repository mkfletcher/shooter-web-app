<template>
    <div class="lobbies-page d-block h-100">
        <div class="lobbies-list">
            <div class="lobby-card" v-for="item in lobbies" v-bind:key="item._id">
                <div class="img" :style="`background-image:url(${item.gameMap.mapTexturePath})`"></div>
                <div class="content">
                    <h5 class="weight-600 mt-2 mb-1">{{ item.gameMap.mapTitle }}</h5>
                    <h6 class="weight-400 m-0">{{ item.gameMode.gameModeTitle }} · 0 / {{ item.gameMaxPlayers }} Players</h6>
                </div>
                <div class="actions text-right">
                    <b-button variant="outline-danger mt-2" :to="`/dashboard/game/${item._id}`">JOIN</b-button>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
	import { request, cancelToken } from './../helpers/request';

    export default {
        data: function () {
            return {
                lobbies: [],
                requestLobbiesLoading: false,
                requestLobbiesCancelToken: cancelToken()
            };
        },
        mounted: async function () {

            // Get maps
            this.requestLobbiesLoading = true;
            setTimeout(() => {
                request({
                    method: 'get',
                    url: 'games',
                    cancelToken: this.requestLobbiesCancelToken.token
                }).then((res) => {
                    this.lobbies = res.json.data;
                }).catch((err) => {
                    console.log(err);
                }).finally(() => {
                    this.requestLobbiesLoading = false;
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
        padding: 12px;
        overflow-y: auto;
        overflow-x: hidden;

        .lobbies-list {
            position: relative;
            display: block;
            width: 100%;
            height: auto;

            .lobby-card {
                position: relative;
                display: block;
                width: 100%;
                height: auto;
                padding: 6px;
                background-color: #FFF;
                text-align: left;
                border-radius: 5px;
                font-size: 0;

                .img {
                    position: relative;
                    display: inline-block;
                    vertical-align: top;
                    width: 60px;
                    height: 60px;
                    background-repeat: no-repeat;
                    background-size: cover;
                    background-position: center;
                    border-radius: 5px;
                }

                .content {
                    position: relative;
                    display: inline-block;
                    vertical-align: top;
                    width: calc(100% - 60px - 120px);
                    padding: 0 6px;
                }

                .actions {
                    position: relative;
                    display: inline-block;
                    vertical-align: top;
                    width: 120px;
                }
            }
        }
    }

</style>