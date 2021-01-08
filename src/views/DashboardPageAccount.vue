<template>
    <div class="account-page d-block h-100">
       <h6>Account</h6>
       <b-button @click="logout">Log Out</b-button>
    </div>
</template>
<script>
	import { request, cancelToken } from './../helpers/request';

    export default {
        data: function () {
            return {
            };
        },
        mounted: async function () {

        },

        destroyed: function () {
        },
        computed: {
           
        },
        methods: {
            logout() {
                window.localStorage.removeItem('JWT');
                window.localStorage.removeItem('userId');
                this.$router.push('/');
            }
        }
    }
</script>
<style lang="scss" scoped>
   
    .lobbies-page {
        padding: 12px;
        
    }

</style>