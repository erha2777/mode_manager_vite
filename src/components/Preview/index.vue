<!-- Preview -->
<script setup lang="ts">
import { computed, defineEmits, defineProps, ref } from 'vue';
import PicturePreview from '../PicturePreview/index.vue';
import StarScore from '../StarScore/index.vue';

const fileType: any = {
    folder: '文件夹',
    // 'file': '文件',
    // 'pic': '图片',
    mode: 'mode',
    modes: 'mode文件夹',
    firstFolder: '一级目录',
    generalMode: '通用mode',
};

const { currentFile, currentFolder } = defineProps({
    currentFile: {
        type: Object,
        default: () => {
            return {};
        },
    },
    currentFolder: {
        type: Object,
        default: () => {
            return {};
        },
    },
});

const isModeType = computed(() => {
    return (
        currentFile.type === 'mode' ||
        currentFile.type === 'modes' ||
        currentFile.type === 'generalMode'
    );
});
const previewKeysShow = computed(() => {
    return isModeType && currentFile.keys && currentFile.keys.length > 0;
});

const previewUrlShow = computed(() => {
    return currentFile.type !== 'firstFolder' && currentFile.type !== 'folder' && currentFile.url;
});

const emit = defineEmits(['showEditDialog', 'openModesFolder']);

// 过滤背景图路径
const filterImgPath = (path: string) => {
    if (path) {
        return encodeURI(`file:///${path.split('\\').join('/')}`);
        // return encodeURI(`${path.split('\\').join('/')}`)
        // return `${path.split('\\').join('/')}`
    }
    return '';
};

/**
 * 打开网页链接
 */
const openWebsite = () => {
    if (currentFile.url) {
        window.windowApi
            .openWebsite(currentFile.url)
            .then((res: any) => {
                console.debug(`成功打开网站: ${currentFile.url}`, res);
            })
            .catch((err: any) => {
                console.error(`打开网站失败: ${err}`);
            });
    }
};

// 窗口相关--end
// 大图预览相关--start
const picturePreviewShow = ref(false);
const PicturePreviewPath = ref('');
const picturePreviewClose = () => {
    picturePreviewShow.value = false;
};
const showPicturePreview = () => {
    let cover = currentFile.cover;
    if (cover) {
        let lastIndex = cover.lastIndexOf('/');
        if (lastIndex !== -1) {
            let path = cover.slice(0, lastIndex);
            PicturePreviewPath.value = path;
            picturePreviewShow.value = true;
        }
    }
};
// 大图预览相关--end

/**
 * 打开系统文件夹
 */
const openSpecificPath = () => {
    if (currentFile.path) {
        window.windowApi
            .openSpecificPath(currentFile.path)
            .then((res: any) => {
                console.debug(`已成功打开文件管理器中的路径: ${currentFile.path}`, res);
            })
            .catch((err: any) => {
                console.error(`打开文件管理器失败: ${err}`);
            });
    }
};
</script>

<template>
    <div class="preview nodrag">
        <div class="preview-title">{{ currentFile.name }}</div>
        <div
            class="preview-cover"
            v-if="currentFile.cover"
            :style="{ 'background-image': `url(${filterImgPath(currentFile.cover)})` }"
        >
            <div class="preview-cover-mask">
                <div class="preview-cover-mask-btn" @click.stop="showPicturePreview">
                    预览大图
                </div>
            </div>
        </div>
        <div class="preview-form">
            <div class="preview-form-label">文件夹类型</div>
            <div class="preview-form-item preview-type">{{ fileType[currentFile.type] }}</div>
            <div class="preview-form-label" v-if="currentFile.desc">
                {{ currentFile.type !== 'folder' ? 'MODE描述' : '文件夹描述' }}
            </div>
            <div class="preview-form-item" v-if="currentFile.desc">{{ currentFile.desc }}</div>
            <div class="preview-form-label" v-if="previewUrlShow">MODE来源URL</div>
            <div class="preview-form-item preview-form-item_url" v-if="previewUrlShow">
                {{ currentFile.url }}
            </div>
            <div class="preview-form-item preview-form-item_open-url" v-if="previewUrlShow" @click.stop="openWebsite">
                打开网站
            </div>
            <div class="preview-form-label" v-if="isModeType">MODE评分</div>
            <div class="preview-form-item" v-if="isModeType">
                <StarScore :model-value="currentFile.score"></StarScore>
            </div>
            <div class="preview-form-label" v-if="previewKeysShow">快捷键</div>
            <template v-if="previewKeysShow">
                <div
                    class="preview-form-item preview-form-item_key"
                    v-for="(key, keyIndex) in currentFile.keys"
                    :key="keyIndex"
                >
                    <div class="preview-form-item_key-name">{{ key[0] }}</div>
                    <div class="preview-form-item_key-val">{{ key[1] }}</div>
                </div>
            </template>
            <div class="preview-btns">
                <div class="preview-btn" @click.stop="emit('showEditDialog')">编辑</div>
                <div class="preview-btn" @click.stop="openSpecificPath">打开文件夹</div>
                <div
                    class="preview-btn"
                    v-if="currentFile.type === 'modes' && currentFile.path !== currentFolder.path"
                    @click.stop="emit('openModesFolder')"
                >
                    查看内部MODE
                </div>
            </div>
            <!-- <pre style="white-space: pre-wrap; overflow: hidden; word-wrap: break-word;">{{
                JSON.stringify(currentFile, null, 4)
            }}</pre> -->
        </div>
    </div>
    <!-- 预览大图 -->
    <PicturePreview :show="picturePreviewShow" :path="PicturePreviewPath" @close="picturePreviewClose"></PicturePreview>
</template>

<style lang="scss" scoped>
@use './index.scss';
</style>
