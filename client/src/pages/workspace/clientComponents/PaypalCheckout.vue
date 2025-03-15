<script lang="ts">
import { watch } from "vue"
import tools from "../../../../../server/src/common/tools";


export default {
    props: ["orderData"],
    emits: ["success", "error"],
    data() {
        return {
            error: "",
            makingPaypalOrder: false,
            submittingPaypalOrder: false,
            makeOrderDataDebounceTimeout: null,
            lastMadeOrderData: null
        }
    },
    methods: {
        async showCheckout() {
            this.makeOrderDataDebounceTimeout = null;
            this.lastMadeOrderData = Date.now();
            console.log("going to checkout");

            tools.paypal.showPaypalButtons(this.$refs.paypalButton.value, this.orderData, {
                onError(error, details) {
                    if (details?.details?.[0]?.description) {
                        this.error = details?.details?.[0]?.description
                        return;
                    }
                    this.error = typeof error === "string" ? error : JSON.stringify(error);
                    this.emit('error', { error, details })
                },
                onSuccess(data, actions) {
                    this.emit('success', { data, actions });
                }
            })
        },
        mounted() {
            watch(() => this.orderData, (newVal) => {
                if (newVal) {
                    if (this.lastMadeOrderData + 10000 > Date.now()) {
                        if (this.makeOrderDataDebounceTimeout)
                            return;
                        else {
                            this.makeOrderDataDebounceTimeout = setTimeout(() => this.showCheckout(), 10000)
                        }
                        this.showCheckout();
                    } else {
                        this.showCheckout();
                    }
                } else {

                }
            }, { immediate: true, deep: true })
        }
    }
}
</script>
<template>
    <div class="paypal-checkout">
        <div ref="paypalButton" v-if="!makeOrderDataDebounceTimeout"></div>
        <div v-else style="padding: 25px; font-weight: bold;">Waiting 10 Seconds to setup Paypal</div>
    </div>
    <div class="turbobuilt-paypal-error" v-if="error"></div>
</template>
<style lang="scss">
.paypal-checkout {}
.turbobuilt-paypal-error {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #d52b2b;
    color: white;
    padding: 5px;
    overflow: auto;
    button {
        border: none;
        background: white;
        border-radius: 2px;
        padding: 5px 10px;
        cursor: pointer;
        margin: 0 auto;
    }
}
</style>