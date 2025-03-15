<script lang="ts" setup>
import { reactive } from "vue"

const props = defineProps<{
    show: boolean
}>();

const d = reactive({
    selectedIndex: null
});

const emit = defineEmits(["keyPressHandler"])

function keyPressHandler(event: KeyboardEvent) {
    console.log("pressed")
    if (d.selectedIndex === null && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
        d.selectedIndex = 0;
        return;
    }
    if (event.key === "ArrowUp") {
        d.selectedIndex -= 1;
    } else if (event.key === "ArrowDown") {
        d.selectedIndex += 1;
    }
    if (event.key === "Enter" && d.selectedIndex !== null) {
        console.log("Enter")
        event.preventDefault();
        event.stopPropagation();
        return { selected: d.selectedIndex }
    }
    console.log(d.selectedIndex);
    if (d.selectedIndex < 0 || d.selectedIndex > 0)
        d.selectedIndex = null;
}

emit("keyPressHandler", keyPressHandler);

</script>
<template>
    <div class="url-dropdown" v-if="props.show">
        <div class="choice" :class="{ selected: d.selectedIndex === 0 }">Insert Variable</div>
    </div>
</template>
<style lang="scss">
@import "@/scss/variables.module.scss";
.url-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    width: 150px;
    background: white;
    z-index: 1;
    box-shadow: 0 0 3px rgba(0, 0, 0, .65);
    .selected {
        background: lighten($color: $primary, $amount: 30);
    }
    .choice {
        padding: 4px;
    }
}
</style>