<script lang="ts" setup>
import { reactive } from "vue";
import MenuItem from "./components/MenuItem.vue";
import { mdiViewDashboard, mdiCart, mdiInformation, mdiWeb, mdiTag, mdiLayersOutline, mdiPageFirst, mdiPageLayoutHeaderFooter, mdiUpload, mdiAccountCircle } from "@mdi/js";
import OrganizationPicker from "./components/OrganizationPicker.vue";
import { store } from "@/store";
import { logout } from "@/lib/setUserData";

const d = reactive({
    open: false,
    userMenuOpen: false
});

function toggleUserMenu() {
    d.userMenuOpen = !d.userMenuOpen;
}

function closeUserMenu() {
    d.userMenuOpen = false;
}

function doLogout() {
    closeUserMenu();
    logout();
    // redirect home
    window.location.href = "/";
}
</script>
<template>
    <div class="main-menu">
        <div class="mobile-bg" :class="{ open: d.open }" @click="d.open = false" />
        <div class="left">
            <v-app-bar-nav-icon class="mobile-menu-icon" @click="d.open = !d.open" style="padding-top: 3px;" color="white" />
            <div class="links-container" :class="{ open: d.open }">
                <div class="links">
                    <div class="mobile-menu-header">Smart Host</div>
                    <!-- <template v-if="store.userState.showDeveloperView"> -->
                    <MenuItem level="1" title="Develop" :icon="mdiViewDashboard" to="/workspace/default" />
                    <MenuItem level="1" title="Components" :icon="mdiLayersOutline" to="/workspace" />
                    <MenuItem level="1" title="Property Types" :icon="mdiLayersOutline" to="/item-property-type" />
                    <!-- </template> -->
                    <MenuItem level="1" title="Purchases" :icon="mdiCart" to="/purchase" />
                    <MenuItem level="1" title="Items" :icon="mdiTag" to="/item" />
                    <MenuItem level="1" title="Page Templates" :icon="mdiPageFirst" to="/website-page-template" />
                    <MenuItem level="1" title="Website" :icon="mdiWeb" to="/website" />
                    <MenuItem level="1" title="Uploads" :icon="mdiUpload" to="/upload" />
                </div>
            </div>
        </div>
        <div class="right">
            <OrganizationPicker />
            <div class="user-menu">
                <div class="user-icon" @click="toggleUserMenu">
                    <v-icon :icon="mdiAccountCircle" size="24" color="white" />
                </div>
                <div v-if="d.userMenuOpen" class="user-dropdown">
                    <div class="dropdown-item" @click="doLogout()">
                        Logout
                    </div>
                </div>
            </div>
        </div>
        <div v-if="d.userMenuOpen" class="user-backdrop" @click="closeUserMenu"></div>
    </div>
</template>
<style lang="scss">
@import "@/scss/variables.module.scss";
.main-menu {
    background: $primary;
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    $height: 3rem;
    height: $height;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    position: relative;
    
    .logo {
        color: white;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0 10px;
    }
    .left {
        display: flex;
        overflow-x: auto;
        max-width: 100vw;
        min-width: 0;
        flex-shrink: 1;
    }
    .right {
        display: flex;
    }
    .user-menu {
        position: relative;
        
        .user-icon {
            cursor: pointer;
            display: flex;
            align-items: center;
            height: 100%;
            padding: 0 10px;
            
            &:hover {
                background: rgba(255, 255, 255, 0.1);
            }
        }
        
        .user-dropdown {
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            min-width: 150px;
            z-index: 101;
            margin-top: 5px;
            
            .dropdown-item {
                padding: 10px 15px;
                cursor: pointer;
                color: #333;
                
                &:hover {
                    background: #f5f5f5;
                }
            }
        }
    }
    
    .user-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 100;
    }
    
    .mobile-menu-icon {
        display: none;
        @media (max-width: $mobile) {
            display: inline-flex;
            cursor: pointer;
        }
    }
    .mobile-bg {
        display: none;
        @media (max-width: $mobile) {
            display: none;
            position: fixed;
            top: $height;
            left: 0;
            right: 0;
            bottom: 0;
            // background: rgba(0, 0, 0, 0);
            z-index: 99;
            &.open {
                display: block;
            }
        }
    }
    .links-container {
        display: flex;
        @media (max-width: $mobile) {
            // display: grid;
            // grid-template-rows: 0fr;
            // overflow: hidden;
            // transition: grid-template-rows 1s;
            position: fixed;
            top: 0; // $height;
            transform: translateX(-110%);
            z-index: 100;
            transition: transform .11s ease-out;
            box-shadow: 0 0 10px rgba(0, 0, 0, .75);
            // padding-right: 10px;
            &.open {
                transform: translateX(0);
                // grid-template-rows: 1fr;
                // .links {
                //     visibility: visible;
                // }
            }
        }
    }
    .mobile-menu-header {
        display: none;
        @media (max-width: $mobile) {
            display: block;
            background: $secondary;
            color: white;
            padding: 1rem;
            font-size: 1.5rem;
            text-align: center;
            border-bottom: 1px solid white;
        }
    }
    .links {
        display: flex;
        @media (max-width: $mobile) {
            background: $primary;
            // min-height: 0;
            // transition: visibility 1s;
            // visibility: hidden;
            display: flex;
            flex-direction: column;
            width: 80vw;
        }
        >a {
            text-decoration: none;
            color: white;
            transition: .1s all;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 0 1rem;
            border-right: 1px solid white;
            transition: .1s all;
            &:active {
                outline: none;
            }
            &.active {
                background: $secondary;
            }
            &:last-child {
                border-right: none;
            }
            @media (min-width: $mobile) {
                &:hover {
                    background: darken($secondary, 10);
                }
            }
            @media (max-width: $mobile) {
                border-bottom: 1px solid white;
                border-right: none;
                padding: 1rem;
                &:last-child {
                    border-bottom: none;
                }
            }
        }
    }
}
</style>