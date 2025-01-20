<!-- SettingDialog -->
<script setup lang="ts">
import { defineEmits, defineProps } from 'vue';

const { show, config } = defineProps({
    show: {
        type: Boolean,
        default: false,
    },
    config: {
        type: Object,
        default: () => {},
    },
});

const emit = defineEmits(['close', 'changeModesFolder', 'changeModesLoadFolder', 'changeBgImg']);
// 关闭编辑弹窗
const closeEdit = () => {
    emit('close');
};

/**
 * 切换存放mode的文件夹路径
 */
const changeModesFolder = async () => {
    window.dialogApi
        .showOpenDialog({ properties: ['openDirectory'] })
        .then((res: any) => {
            let file = res.filePaths[0].split('\\').join('/');
            config.path = file;
            const data = JSON.stringify(config, null, 4);
            window.fsApi.writeFile('config.json', data, 'utf-8', (err: any) => {
                if (err) throw err;
                console.log('文件已被保存');
                emit('changeModesFolder', file);
            });
        })
        .catch(() => {});
};

/**
 * 切换mode加载器载入mode的文件夹路径
 */
const changeModesLoadFolder = () => {
    window.dialogApi
        .showOpenDialog({ properties: ['openDirectory'] })
        .then((res: any) => {
            let file = res.filePaths[0].split('\\').join('/');
            console.debug(res, res.filePaths, file);
            config.modesPath = file;
            const data = JSON.stringify(config, null, 4);
            window.fsApi.writeFile('config.json', data, 'utf-8', (err: any) => {
                if (err) throw err;
                console.log('文件已被保存');
                emit('changeModesLoadFolder', file);
            });
        })
        .catch(() => {});
};
/**
 * 切换mode加载器载入mode的文件夹路径
 */
const changeBgImg = () => {
    window.dialogApi
        .showOpenDialog({
            // 设置对话框的属性
            title: '在指定文件夹中选择文件',
            // 只允许选择文件
            properties: ['openFile'],
            // 仅允许选择图片
            filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'] }],
            // 指定初始打开的文件夹路径，可根据需求修（不支持中文）
            // defaultPath: path.join(__dirname, 'your-folder')
            // defaultPath: window.pathApi.normalize(currentFile.path),
        })
        .then((result: any) => {
            if (!result.canceled) {
                // 获取选择的文件路径
                const filePath = result.filePaths[0];
                console.log('选择的文件路径: ', filePath);
                let bgImg = filePath.replace(/\\/g, '/');
                config.bgImgPath = bgImg;
                const data = JSON.stringify(config, null, 4);
                window.fsApi.writeFile('config.json', data, 'utf-8', (err: any) => {
                    if (err) throw err;
                    emit('changeBgImg', bgImg);
                });
            }
        });
};
</script>

<template>
    <div class="dialog dialog_settings" v-if="show">
        <div class="dialog__mask drag"></div>
        <span class="dialog__close iconfont icon-fanhui nodrag" @click.stop="closeEdit"></span>
        <div class="dialog__body nodrag">
            <div class="dialog_settings-item">
                <div class="dialog_settings-item-label no-select">切换存放mode的文件夹路径:</div>
                <div class="dialog_settings-item-val" @click="changeModesFolder">{{ config.path || '请选择' }}</div>
            </div>
            <div class="dialog_settings-item">
                <div class="dialog_settings-item-label no-select">切换mode加载器载入mode的文件夹路径:</div>
                <div class="dialog_settings-item-val" @click="changeModesLoadFolder">
                    {{ config.modesPath || '请选择' }}
                </div>
            </div>
            <div class="dialog_settings-item">
                <div class="dialog_settings-item-label no-select">选择背景图片路径:</div>
                <div class="dialog_settings-item-val" @click="changeBgImg">{{ config.bgImgPath || '请选择' }}</div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@use './index.scss';
</style>
