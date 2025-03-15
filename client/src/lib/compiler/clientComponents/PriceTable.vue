<script lang="ts" setup>
import { defineProps, onMounted, reactive, watch } from 'vue';

const emit = defineEmits(["update:modelValue"]);

const props = defineProps<{
    modelValue: any;
}>()

watch(() => props.modelValue, async (newVal) => {
    if (newVal) {
        if (!newVal.tiers) {
            emit("update:modelValue", reactive({
                tiers: [{ price: 0, quantity: null }],
                currency: 'usd',
                symbol: '$'
            }));
        }
    } else {
        emit("update:modelValue", reactive({
            tiers: [{ price: 0, quantity: null }],
            currency: 'usd',
            symbol: '$'
        }));
    }
}, { immediate: true });



// exhaustive list of all currencies: symbol
const currencies = {
    aud: "A$",
    cad: "C$",
    chf: "CHF",
    cny: "¥",
    eur: "€",
    gbp: "£",
    jpy: "¥",
    usd: "$",
    inr: "₹",
    rub: "₽",
    brl: "R$",
    zar: "R",
    nzd: "NZ$",
    sgd: "S$",
    hkd: "HK$"
};

function updateCurrency(event) {
    props.modelValue.currency = event.target.value;
    props.modelValue.symbol = currencies[event.target.value];
}
</script>
<template>
    <div class="price-table" v-if="props.modelValue">
        <h4>Price</h4>
        <div v-for="(priceTier, index) in props.modelValue.tiers" :key="index" class="price-row">
            <div class="price-input-container" tabindex="1">
                <div class="currency-symbol">{{ props.modelValue.symbol }}</div>
                <input type="number" v-model="priceTier.price" />
            </div>
            <select :value="props.modelValue.currency" @change="$event => updateCurrency($event)" v-if="index === 0">
                <option v-for="(symbol, code) in currencies" :key="code" :value="code">
                    {{ code.toUpperCase() }}
                </option>
            </select>
        </div>
    </div>
</template>
<template>
    <div class="price-table">
        <h4>Price</h4>
        <div v-for="(priceTier, index) in props.modelValue" :key="index" class="price-row">
            <!-- <input type="number" v-model="item.quantity" /> -->
            <div class="price-input-container" tabindex="1">
                <div class="currency-symbol">{{ currencies[priceTier.currency] }}</div>
                <input type="number" v-model="priceTier.price" />
            </div>
            <select v-model="priceTier.currency">
                <option value="usd">USD</option>
                <option value="eur">EUR</option>
                <option value="gbp">GBP</option>
            </select>
        </div>
    </div>
</template>
<style lang="scss">
.price-table {
    h4 {
        margin-top: 8px;
        margin-bottom: 3px;
    }

    .currency-symbol {
        padding: 5px;
        padding-right: 3px;
    }

    select {
        padding: 4px;
        border: 1px solid silver;
        border-left: 0;

        &:active,
        &:focus {
            outline: none;
        }
    }

    .price-input-container {
        border: 1px solid silver;
        display: flex;
        align-items: center;
    }

    .price-row {
        display: flex;
        // align-items: center;
        margin-bottom: 10px;
    }

    input {
        padding: 5px;
        padding-left: 0;
        line-height: 1;

        &:active,
        &:focus {
            outline: none;
        }
    }
}
</style>