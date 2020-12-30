<template>
    <div class="lobby-card">
        <div class="img" :style="`background-image:url(${lobby.gameMap.mapTexturePath})`"></div>
        <div class="content">
            <h5 class="weight-600 mt-2 mb-1">{{ lobby.gameMap.mapTitle }}</h5>
            <h6 class="weight-400 m-0">{{ lobby.gameMode.gameModeTitle }} · 0 / {{ lobby.gameMaxPlayers }} Players</h6>
            <h6 class="weight-400 m-0" ref="timeAgo"></h6>
        </div>
        <div class="actions text-right">
            <b-button variant="outline-danger mt-2" :to="`/dashboard/game/${lobby._id}`">JOIN</b-button>
        </div>
    </div>
</template>

<script>

	/**
	 * Imports
	 */
    import moment from "moment";
    
	/**
     * Lobby Card
     * @version 1.0
     */
    export default {
        name: 'lobby-card',
        props: {
            lobby: {  type: Object, default: () => {} },
        },
        data: function () {
            return {
                lobbyStartTime: null,
                intervalTimer: null,
            };
        },
        methods: {
            updateTimeAgo(str) {
                this.$refs.timeAgo.textContent = str;
            }
        },
        mounted: function () {
            if (moment().isAfter(this.lobby.gameStartDatetime)) {
                this.intervalTimer = setInterval(() => {
                    this.updateTimeAgo("Open for: " + moment(this.lobby.gameStartDatetime).fromNow(true));
                }, 1000);
            } else {
                this.intervalTimer = setInterval(() => {
                    this.updateTimeAgo("Opens in: " + moment(this.lobby.gameStartDatetime).fromNow(true));
                }, 1000);
            }
        },
        beforeDestroy() {
            clearInterval(this.intervalTimer);
        }
    }
</script>

<style scoped lang="scss">
    @import '../scss/variables.scss';

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
        margin-bottom: 12px;

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

</style>
