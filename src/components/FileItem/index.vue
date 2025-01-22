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
    selected: {
        type: Boolean,
        default: false,
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
            'file-item_folder': item.type === 'folder',
            'file-item_file': item.type === 'file',
            'file-item_pic': item.type === 'pic',
            'file-item_mode': item.type !== 'pic' && item.type !== 'file',
            'file-item_modes': item.type === 'modes',
            'file-item_img': item.type === 'pic',
            'file-item_select': selected,
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
        <span v-if="selected" class="file-item__checked iconfont icon-gouxuan"></span>
    </div>
</template>

<style lang="scss" scoped>
@use './index.scss';
</style>
