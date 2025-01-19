<!-- PicturePreview -->
<script setup lang="ts">
import { defineEmits, defineProps, reactive, watch } from 'vue'
// import Swiper core and required modules
import { Navigation, Pagination, A11y } from 'swiper/modules'
// Import Swiper Vue.js components
import { Swiper, SwiperSlide } from 'swiper/vue'
// Import Swiper styles
import 'swiper/swiper-bundle.css'
const { show, path } = defineProps({
    show: {
        type: Boolean,
        default: false,
    },
    path: {
        type: String,
        default: '',
    },
})

const onSwiper = (swiper: any) => {
    console.log(swiper)
}
const onSlideChange = () => {
    console.log('slide change')
}

const emit = defineEmits(['close'])

// 关闭窗
const close = () => {
    emit('close')
}

const imgList: any[] = reactive([])

watch(
    () => path,
    (newPath) => {
        // 判断是文件夹还是文件
        if (newPath && window.fsApi.isDirectory(newPath)) {
            let files = window.fsApi.readdirSync(newPath)
            const imageFiles: string[] = []
            files.forEach((file: string) => {
                const extname = window.pathApi.extname(file).toLowerCase()
                if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(extname)) {
                    imageFiles.push(`${newPath}/${file}`)
                }
            })
            imgList.splice(0, imgList.length)
            imgList.push(...imageFiles)
        } else {
            imgList.splice(0, imgList.length)
            imgList.push(newPath)
        }
    },
    { immediate: true }
)

// 过滤背景图路径
const filterImgPath = (path: string) => {
    if (path) {
        return encodeURI(`file:///${path.split('\\').join('/')}`)
        // return encodeURI(`${path.split('\\').join('/')}`)
        // return `${path.split('\\').join('/')}`
    }
    return ''
}
</script>

<template>
    <div class="picture-preview nodrag" v-show="show">
        <span class="picture-preview__close iconfont icon-fanhui" @click.stop="close"></span>
        <swiper class="picture-preview__swiper" :loop="true" :modules="[Navigation, Pagination, A11y]" navigation pagination scrollbar @swiper="onSwiper" @slideChange="onSlideChange">
            <swiper-slide class="picture-preview__swiper-item" v-for="(item, index) in imgList" :key="index">
                <div class="picture-preview__swiper-item-val" :style="{ 'background-image': `url(${filterImgPath(item)})` }"></div>
            </swiper-slide>
        </swiper>
    </div>
</template>

<style lang="scss" scoped>
@use './index.scss';
</style>
