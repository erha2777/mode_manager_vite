<!-- FileItem -->
<script setup lang="ts">
import { defineProps } from 'vue';

const { item } = defineProps({
    item: {
        type: Object,
        default: () => {
            return {};
        },
    },
});

// 过滤背景图路径
const filterImgPath = (path: string) => {
    if (path) {
        return encodeURI(`file:///${path.split('\\').join('/')}`);
        // return encodeURI(`${path.split('\\').join('/')}`)
        // return `${path.split('\\').join('/')}`
    }
    return '';
};
</script>

<template>
    <div
        class="file-item"
        :class="{
            border_folder: item.type === 'folder',
            border_file: item.type === 'file',
            border_pic: item.type === 'pic',
            border_mode: item.type !== 'pic' && item.type !== 'file',
            border_modes: item.type === 'modes',
            'file-list-item_img': item.type === 'pic',
            'file-list-item_file': item.type !== 'folder',
        }"
    >
        <div
            class="file-item-cover"
            v-if="item.type !== 'file' && item.type !== 'pic'"
            :style="{ 'background-image': `url('${filterImgPath(item.cover)}')` }"
        ></div>
        <!-- <img class="file-item-img" v-if="item.type === 'pic'" :src="item.path" /> -->
        <div
            class="file-item-cover"
            v-if="item.type === 'pic'"
            :style="{ 'background-image': `url(${filterImgPath(item.path)})` }"
        ></div>

        <div class="file-item-name" v-if="item.type === 'file'">{{ item.fileName }}</div>
        <div class="file-item-msg" v-if="item.type !== 'file'">
            <div class="file-item-name">{{ item.fileName }}</div>
            <div class="file-item-tag" v-if="item.type !== 'folder'">{{ item.name }}</div>
            <!-- <div class="file-item-desc" v-if="item.type !== 'pic' && item.desc">{{ item.desc }}</div> -->
        </div>
    </div>
</template>

<style lang="scss" scoped>
@use './index.scss';
</style>
