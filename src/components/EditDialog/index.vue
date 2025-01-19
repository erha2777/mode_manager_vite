<!-- EditDialog -->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import StarScore from '../StarScore/index.vue'
import PicturePreview from '../PicturePreview/index.vue'
const fileType: any = {
    folder: '文件夹',
    // 'file': '文件',
    // 'pic': '图片',
    mode: 'mode',
    modes: 'mode文件夹',
    firstFolder: '一级目录',
    generalMode: '通用mode',
}
const { editShow, currentFileEdit, currentFile } = defineProps({
    editShow: Boolean,
    currentFileEdit: {
        type: Object,
        default: () => {
            return {
                type: '',
                fileName: '',
                name: '',
                path: '',
                desc: '',
                score: 0,
                keys: [],
                url: '',
            }
        },
    },
    currentFile: {
        type: Object,
        default: () => {
            return {
                type: '',
                fileName: '',
                name: '',
                path: '',
                desc: '',
                score: 0,
                keys: [],
                url: '',
            }
        },
    },
})

const isModeType = computed(() => {
    return currentFileEdit.type === 'mode' || currentFileEdit.type === 'modes' || currentFileEdit.type === 'generalMode'
})
let addKeyShow: any = ref(false) // 显示快捷键弹窗
let currentFileEditKeys: any = reactive([]) // 编辑中的快捷键

const emit = defineEmits(['closeEdit', 'confirmEdit'])
// 关闭编辑弹窗
const closeEdit = () => {
    closeAddKeys()
    emit('closeEdit')
}
// 过滤背景图路径
const filterImgPath = (path: string) => {
    if (path) {
        return encodeURI(`file:///${path.split('\\').join('/')}`)
        // return encodeURI(`${path.split('\\').join('/')}`)
        // return `${path.split('\\').join('/')}`
    }
    return ''
}

// 快捷键相关 -- start
// 切换添加快捷键
const changeAddKey = () => {
    if (!addKeyShow.value) {
        if (currentFileEditKeys.length === 0) {
            if (currentFileEdit.keys.length) {
                currentFileEditKeys.push(...JSON.parse(JSON.stringify(currentFileEdit.keys)))
            } else {
                addKey()
            }
        }
        addKeyShow.value = true
    } else {
        currentFileEditKeys.splice(0, currentFileEditKeys.length)
        addKeyShow.value = false
    }
}
/**
 * 关闭快捷键弹窗
 */
const closeAddKeys = () => {
    currentFileEditKeys.splice(0, currentFileEditKeys.length)
    addKeyShow.value = false
}
// 添加快捷键
const addKey = (index?: number) => {
    if (index !== undefined) {
        currentFileEditKeys.splice(index + 1, 0, ['', ''])
    } else {
        currentFileEditKeys.push(['', ''])
    }
}
// 删除快捷键
const delKey = (index: number) => {
    currentFileEditKeys.splice(index, 1)
}
// 保存快捷键
const saveKey = () => {
    let arr = currentFileEditKeys.filter((v: any) => v[0] || v[1])
    currentFileEdit.keys.splice(0, currentFileEdit.keys.length)
    currentFileEdit.keys.push(...JSON.parse(JSON.stringify(arr)))
    currentFileEditKeys.splice(0, currentFileEditKeys.length)
    addKeyShow.value = false
}
// 快捷键相关 -- end

// 打开指定文件夹
const openFolder = () => {
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
            defaultPath: window.pathApi.normalize(currentFile.path),
        })
        .then((result: any) => {
            if (!result.canceled) {
                // 获取选择的文件路径
                const filePath = result.filePaths[0]
                console.log('选择的文件路径: ', filePath)
                currentFileEdit.cover = filePath.replace(/\\/g, '/')
                // 在这里可以对选择的文件进行进一步的操作
            }
        })
}
// 保存文件数据修改
const saveEdit = () => {
    Object.keys(currentFileEdit).forEach((key) => {
        // 修改选中列表中的当前项
        currentFile[key] = JSON.parse(JSON.stringify(currentFileEdit[key]))
    })
    window.fsApi.writeFile(`${currentFile.path}/fileData.json`, JSON.stringify(currentFile, null, 4), (err: any) => {
        if (err) {
            return console.error(err)
        }
        console.log('文件已修改')
        emit('confirmEdit')
    })
}

// 切换文件夹类型
const changeType = (type: string) => {
    currentFileEdit.type = type
}

/**
 * 打开网页链接
 */
const openWebsite = (url: string) => {
    if (url) {
        window.windowApi
            .openWebsite(url)
            .then((res: any) => {
                console.log(`成功打开网站: ${url}`, res)
            })
            .catch((err: any) => {
                console.error(`打开网站失败: ${err}`)
            })
    }
}

// 大图预览相关--start
const picturePreviewShow = ref(false)
const PicturePreviewPath = ref('')
const picturePreviewClose = () => {
    picturePreviewShow.value = false
}
const showPicturePreview = () => {
    if (currentFileEdit.cover) {
        let lastIndex = currentFileEdit.cover.lastIndexOf('/')
        if (lastIndex !== -1) {
            let path = currentFileEdit.cover.slice(0, lastIndex)
            PicturePreviewPath.value = path
            picturePreviewShow.value = true
        }
    }
}
// 大图预览相关--end
</script>

<template>
    <div class="dialog dialog_edit" v-show="editShow">
        <div class="dialog__mask drag"></div>
        <div class="dialog__body nodrag">
            <div class="dialog__body-content">
                <div class="dialog__body-content-title">
                    编辑（
                    <div class="dialog__body-content-type">
                        <template v-for="(item, index) in Object.keys(fileType).filter((v) => v !== 'firstFolder')" :key="index">
                            <span class="dialog__body-content-type-item" :class="{ active: item === currentFileEdit.type }" @click.stop="changeType(item)">{{ fileType[item] }}</span
                            ><span v-if="index + 1 !== Object.keys(fileType).filter((v) => v !== 'firstFolder').length">/</span>
                        </template>
                    </div>
                    ）信息
                </div>
                <div class="dialog__body-content-left" :style="{ 'background-image': `url(${filterImgPath(currentFileEdit.cover)})` }">
                    <div class="dialog__body-content-left-bottom">
                        <div class="dialog__body-content-left-bottom-preview" @click.stop="showPicturePreview">预览大图</div>
                        <div class="dialog__body-content-left-bottom-replace" @click.stop="openFolder">更换图片</div>
                    </div>
                </div>
                <div class="dialog__body-content-right">
                    <div class="dialog__body-form-item">
                        <div class="dialog__body-form-item-label">{{ `${fileType[currentFileEdit.type]}名称` }}</div>
                        <div class="dialog__body-form-item-operate dialog__body-form-item-operate_name">{{ currentFileEdit.fileName }}</div>
                    </div>
                    <div class="dialog__body-form-item" v-if="isModeType || currentFileEdit.type === 'firstFolder'">
                        <div class="dialog__body-form-item-label">{{ `${currentFileEdit.type === 'firstFolder' ? '目录' : currentFileEdit.type === 'mode' ? '角色' : 'mode'}名称` }}</div>
                        <div class="dialog__body-form-item-operate">
                            <input class="dialog__body-form-item-input" style="text-align: center;" v-model="currentFileEdit.name" type="text" />
                        </div>
                    </div>
                    <div class="dialog__body-form-item" v-if="isModeType">
                        <div class="dialog__body-form-item-label">MODE来源URL</div>
                        <div class="dialog__body-form-item-operate">
                            <div class="dialog__body-form-item-btn" @click.stop="openWebsite(currentFileEdit.url)">
                                <span class="iconfont icon-mti-tiaozhuan"></span>
                            </div>
                            <input class="dialog__body-form-item-input" style="width: 260px;" v-model="currentFileEdit.url" type="text" />
                        </div>
                    </div>
                    <div class="dialog__body-form-item" v-if="isModeType">
                        <div class="dialog__body-form-item-label">MODE评分</div>
                        <div class="dialog__body-form-item-right">
                            <StarScore v-model="currentFileEdit.score"></StarScore>
                        </div>
                    </div>
                    <div class="dialog__body-form-item" v-if="currentFileEdit.type === 'mode'">
                        <div class="dialog__body-form-item-label">快捷键</div>
                        <div class="dialog__body-form-item-right">
                            <div class="dialog__body-form-item-key" v-for="(key, keyIndex) in currentFileEdit.keys" :key="keyIndex" :title="key[1]">{{ key[0] }}</div>
                            <div class="dialog__body-form-item-operate dialog__body-form-item-operate_key">
                                <div class="dialog__body-form-item-btn" :style="{ transform: `rotate(${addKeyShow ? '0deg' : '90deg'})` }" @click.stop="changeAddKey">
                                    <span class="iconfont icon-down_arrow"></span>
                                </div>
                            </div>
                        </div>
                        <div class="dialog__body-form-item-keys" v-if="addKeyShow">
                            <!-- <div class="dialog__body-form-item-keys-item add" v-if="!(currentFileEdit.keys.length)" @click="addKey">
                                            +
                                        </div> -->
                            <div class="dialog__body-form-item-keys-item" v-for="(key, keyIndex) in currentFileEditKeys" :key="keyIndex">
                                <div class="dialog__body-form-item-keys-item-left">
                                    <input class="dialog__body-form-item-keys-item-name" v-model="key[0]" type="text" />
                                    <input class="dialog__body-form-item-keys-item-val" v-model="key[1]" type="text" />
                                </div>
                                <div class="dialog__body-form-item-keys-item-right">
                                    <button @click.stop="addKey(keyIndex)">+</button>
                                    <button @click.stop="delKey(keyIndex)">-</button>
                                </div>
                            </div>
                            <div class="dialog__body-form-item-keys-item add-key-btns nodrag">
                                <div class="add-key-btns-item" @click.stop="saveKey">保存</div>
                            </div>
                        </div>
                    </div>
                    <div class="dialog__body-form-item dialog__body-form-item_desc">
                        <div class="dialog__body-form-item-label">{{ `${fileType[currentFileEdit.type]}描述` }}</div>
                        <textarea class="dialog__body-form-item-textarea" v-model="currentFileEdit.desc"></textarea>
                    </div>
                </div>
            </div>
            <div class="dialog__body-btns nodrag">
                <div class="dialog__body-btns-item cancel" @click="closeEdit">取消</div>
                <div class="dialog__body-btns-item confirm" @click="saveEdit">保存</div>
            </div>
        </div>
    </div>
    <PicturePreview :show="picturePreviewShow" :path="PicturePreviewPath" @close="picturePreviewClose"></PicturePreview>
</template>

<style lang="scss" scoped>
@use './index.scss';
</style>
