<!-- SettingDialog -->
<script setup lang="ts">
import { defineEmits, defineProps } from 'vue'

const { show, config } = defineProps({
    show: {
        type: Boolean,
        default: false,
    },
    config: {
        type: Object,
        default: () => {},
    },
})

const emit = defineEmits(['close', 'changeModesFolder', 'changeModesLoadFolder'])
// 关闭编辑弹窗
const closeEdit = () => {
    emit('close')
}

/**
 * 切换存放mode的文件夹路径
 */
const changeModesFolder = async () => {
    window.dialogApi
        .showOpenDialog({ properties: ['openDirectory'] })
        .then((res: any) => {
            let file = res.filePaths[0].split('\\').join('/')
            config.path = file
            const data = JSON.stringify(config, null, 4)
            window.fsApi.writeFile('config.json', data, 'utf-8', (err: any) => {
                if (err) throw err
                console.log('文件已被保存')
                emit('changeModesFolder', file)
            })
        })
        .catch(() => {})
}

/**
 * 切换mode加载器载入mode的文件夹路径
 */
const changeModesLoadFolder = () => {
    window.dialogApi
        .showOpenDialog({ properties: ['openDirectory'] })
        .then((res: any) => {
            let file = res.filePaths[0].split('\\').join('/')
            console.debug(res, res.filePaths, file)
            config.modesPath = file
            const data = JSON.stringify(config, null, 4)
            window.fsApi.writeFile('config.json', data, 'utf-8', (err: any) => {
                if (err) throw err
                console.log('文件已被保存')
                emit('changeModesLoadFolder', file)
            })
        })
        .catch(() => {})
}
</script>

<template>
    <div class="dialog dialog_settings nodrag" v-if="show">
        <div class="dialog__mask" @click="closeEdit"></div>
        <div class="dialog__body">
            <div class="dialog_settings-item">
                <div class="dialog_settings-item-btn no-select" @click="changeModesFolder">切换存放mode的文件夹路径</div>
                <div class="dialog_settings-item-val">{{ config.path }}</div>
            </div>
            <div class="dialog_settings-item">
                <div class="dialog_settings-item-btn no-select" @click="changeModesLoadFolder">切换mode加载器载入mode的文件夹路径</div>
                <div class="dialog_settings-item-val">{{ config.modesPath }}</div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@use './index.scss';
</style>
