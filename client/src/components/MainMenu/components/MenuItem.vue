<script lang="ts" setup>
const props = defineProps(["level", "title", "icon", "to", "children"]);

</script>
<template>
    <router-link class="menu-item" :class="`level-${props.level}`" :to="props.to" @click.stop>
        <v-icon :icon="props.icon" v-if="$props.icon" style="margin-right: 10px;"/>
        <span>{{ props.title }}</span>
        <div v-for="child in props.children" :key="child.id">
            <MenuItem :level="props.level + 1" :title="child.title" :icon="child.icon" :to="child.to" :children="child.children" />
        </div>
    </router-link>
</template>
<style lang="scss">
.menu-item {

}
</style>