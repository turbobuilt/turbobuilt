<script setup>
import { computed } from 'vue'

const props = defineProps({
    json: {
        type: Object,
        required: true
    }
})

function traverse(obj, depth, result) {
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            result.push({ value: `${key}:`, depth })
            traverse(obj[key], depth + 1, result)
        } else {
            result.push({ value: `${key}: ${obj[key]}`, depth })
        }
    }
}

const items = computed(() => {
    const result = []
    traverse(props.json, 0, result)
    return result
})
</script>
<template>
    <div v-for="(item, index) in items" :key="index" :style="{ marginLeft: item.depth * 20 + 'px' }">
        {{ item.value }}
    </div>
</template>
