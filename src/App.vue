<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
// import { ipcRenderer, dialog } from 'electron'
// import path from 'path'
// import fs from 'fs'
import EditDialog from './components/EditDialog/index.vue'

const fileType: any = {
    folder: '文件夹',
    // 'file': '文件',
    // 'pic': '图片',
    mode: 'mode',
    modes: 'mode文件夹',
    firstFolder: '一级目录',
    generalMode: '通用mode',
}

let rootPath: any = ref('')
let modesPath: any = ref('')
let rootFolders: any = reactive([]) // 一级目录
let folderContent: any = reactive([]) // 文件夹内容
// let folderName: any = ref('')
let currentFolder: any = reactive({}) // 当前点击的顶级文件夹
let currentFile: any = ref({}) // 当前选中的文件数据
let currentFileEdit: any = reactive({
    type: '',
    fileName: '',
    name: '',
    path: '',
    desc: '',
    keys: [],
    url: '',
}) // 用来编辑的文件数据
let config: any = reactive({})
let editShow: any = ref(false) // 显示编辑弹窗
let selectFiles: any = reactive([]) // 选中的文件
let preFolder: any = reactive([]) // 上级目录
let generalModes: any = reactive({}) // 通用mode
let currentClick: any = reactive({}) // 通用mode

const init = () => {
    // 获取全部配置
    window.fsApi.readFile('config.json', 'utf-8', (err: any, data: any) => {
        if (err) throw err
        console.log(JSON.parse(data))
        config = JSON.parse(data)
        print()
    })
}

init()

// 计算属性
const selectFilePath = computed(() => {
    let arr = preFolder.map((v: any) => v.fileName)
    return arr.join('/')
})

const currentPreview = computed(() => {
    if (currentFile.value.name) {
        return currentFile.value
    }
    if (selectFilePath.value && selectFiles[selectFilePath.value]) {
        return selectFiles[selectFilePath.value]
    } else if (selectFilePath.value && generalModes[selectFilePath.value] && generalModes[selectFilePath.value]?.length > 0) {
        return generalModes[selectFilePath.value][0]
    } else {
        return currentFolder
    }
})

// const filterFileType = computed(() => {
//     return Object.keys(fileType) || []
// })
const isModeType = computed(() => {
    return currentFileEdit.type === 'mode' || currentFileEdit.type === 'modes' || currentFileEdit.type === 'generalMode'
})
const isModeType2 = computed(() => {
    return currentPreview.value.type === 'mode' || currentPreview.value.type === 'modes'
})

// methods
// 读取根目录文件
const print = async () => {
    const path = config.path
    rootPath.value = path
    modesPath.value = config.modesPath
    const dir = await window.fsApi.readdirSync(path)

    dir.forEach(async (fileName: string) => {
        let filePath = `${path}/${fileName}`
        if (window.fsApi.isDirectory(filePath)) {
            let fileData: any = {
                type: 'firstFolder',
                name: fileName,
                path: filePath,
                fileName: fileName,
                desc: '',
            }
            let fileDataPath = `${filePath}/fileData.json`
            // 检测是否已经生成过数据文件
            if (window.fsApi.existsSync(fileDataPath)) {
                let data = window.fsApi.readFileSync(fileDataPath, 'utf8')
                fileData = JSON.parse(data)
            } else {
                fileData.cover = getFolderCover(filePath) || ''
                window.fsApi.writeFile(fileDataPath, JSON.stringify(fileData, null, 4), (err: any) => {
                    if (err) {
                        return console.error(err)
                    }
                    console.log('文件已创建')
                })
            }
            rootFolders.push(fileData)
        }
    })
}

// 获取目录内文件
const getContent = (path: string) => {
    console.log(path)
    let flies = window.fsApi.readdirSync(path)
    let flieList: any = []
    flies.forEach((fileName: string) => {
        console.debug('getContent--', fileName)
        let filePath = `${path}/${fileName}`
        let fileDataPath = `${path}/${fileName}/fileData.json`
        let type = 'folder'
        if (!window.fsApi.isDirectory(filePath)) {
            type = 'file'
            if (fileName.includes('.png') || fileName.includes('.jpg')) {
                type = 'pic'
            }
        }

        let fileData: any = {
            type,
            fileName,
            name: fileName,
            path: filePath,
            desc: '',
            keys: [],
            url: '',
            score: 0,
        }

        if (type === 'folder') {
            // 检测是否已经生成过数据文件
            if (window.fsApi.existsSync(fileDataPath)) {
                // fileData
                let data = window.fsApi.readFileSync(fileDataPath, 'utf8')
                fileData = JSON.parse(data)
            } else {
                fileData.cover = getFolderCover(filePath) || ''
                window.fsApi.writeFile(fileDataPath, JSON.stringify(fileData, null, 4), (err: any) => {
                    if (err) {
                        return console.error(err)
                    }
                    console.log('文件已创建')
                })
            }
            flieList.push(fileData)
        }
    })
    console.debug(flieList)
    return flieList
}

// 获取文件夹封面
const getFolderCover = (path: string) => {
    let arr = window.fsApi.readdirSync(path)
    let url = ''
    arr.forEach((fileName: string) => {
        if (fileName.includes('.png') || fileName.includes('.jpg')) {
            url = `${path}/${fileName}`
        }
    })
    return url
}

// 切换文件夹
const changeContent = (item: any, clear?: boolean) => {
    console.debug('changeContent', item)
    if (clear) {
        preFolder.splice(0, preFolder.length)
        preFolder.push(item)
        currentFile.value = {}
    }
    setFiles(item)
}

// 返回上一级文件
const fileGoBack = (item: any) => {
    let index = preFolder.findIndex((v: any) => v.path === item.path)
    if (index !== -1) {
        preFolder.splice(index + 1, preFolder.length)
    }
    setFiles(item)
}

// 设置文件夹内容
const setFiles = (item: any) => {
    currentFolder = item
    currentFile.value = currentPreview.value
    let files = getContent(item.path)
    files.sort((a: any, b: any) => {
        if (a.type === 'mode') {
            if (b.type !== 'mode') {
                return -1
            } else {
                return b.score - a.score
            }
        }
        if (a.type === 'modes') {
            if (b.type === 'mode' || b.type === 'generalMode') {
                return 1
            } else {
                if (b.type === 'folder') {
                    return -1
                } else {
                    if (b.type === 'modes') {
                        return b.score - a.score
                    }
                    return 0
                }
            }
        }
        if (a.type === 'generalMode') {
            if (b.type !== 'mode') {
                return -1
            } else {
                return 0
            }
        }
        if (a.type === 'folder') {
            if (b.type !== 'folder') {
                return 1
            } else {
                return 0
            }
        }

        return 0
    })
    folderContent = files
}

// 选中文件夹
const selectFile = (item: any) => {
    currentClick = item
    if (item.type !== 'file' && item.type !== 'pic') {
        // mode切换
        if (item.type === 'generalMode') {
            if (selectFilePath && generalModes[selectFilePath.value]) {
                let index = generalModes[selectFilePath.value].findIndex((v: any) => v.path === item.path)
                if (index === -1) {
                    generalModes[selectFilePath.value].push(item)
                    setCurrentFile(item)
                } else {
                    generalModes[selectFilePath.value].splice(index, 1)
                    currentFile.value = {}
                }
            } else {
                generalModes[selectFilePath.value] = [item]
                setCurrentFile(item)
            }
        } else {
            if (selectFiles?.[selectFilePath.value]) {
                if (selectFiles[selectFilePath.value].path === item.path) {
                    selectFiles[selectFilePath.value] = null
                    currentFile.value = {}
                    // 取消选中的是mods文件夹，下面的mod也要取消选中
                    if (item.type === 'modes') {
                        Object.keys(selectFiles).forEach((key) => {
                            if (key.indexOf(selectFilePath.value + '/') === 0) {
                                selectFiles[key] = null
                            }
                        })
                    }
                } else {
                    selectFiles[selectFilePath.value] = item
                    setCurrentFile(item)
                    // 选中的是上面的mod下面mods文件夹里面选中的也要取消掉
                    Object.keys(selectFiles).forEach((key) => {
                        if (key.indexOf(selectFilePath.value + '/') === 0) {
                            selectFiles[key] = null
                        }
                    })
                }
            } else {
                selectFiles[selectFilePath.value] = item
                setCurrentFile(item)
            }
        }
    }
}

// 设置当前选中文件数据
const setCurrentFile = (item: any) => {
    currentFile.value = item
    Object.keys(item).forEach((key) => {
        currentFileEdit[key] = JSON.parse(JSON.stringify(item[key]))
    })
}

// 打开modes文件夹
const openModesFolder = () => {
    preFolder.push(currentFile.value)
    changeContent(currentFile.value)
}

// 过滤选中
const filterActiveFile = (item: any) => {
    if (item.type === 'generalMode') {
        if (selectFilePath && generalModes[selectFilePath.value] && generalModes[selectFilePath.value]?.length > 0) {
            let index = generalModes[selectFilePath.value].findIndex((v: any) => v.path === item.path)
            return index !== -1
        }
        return false
    } else {
        if (selectFilePath.value && selectFiles[selectFilePath.value]?.path) {
            return selectFiles[selectFilePath.value]?.path === item.path
        }
        return false
    }
}

// 过滤背景图路径
const filterImgPath = (path: string) => {
    if (path) {
        // return encodeURI(`file:///${path.split('\\').join('/')}`)
        // return encodeURI(`${path.split('\\').join('/')}`)
        return `${path.split('\\').join('/')}`
    }
    return ''
}

// 过滤文件类型
// const filterFileType = (type: string) => {
//     return fileType[type]
// }

// 显示编辑弹窗
const showEditDialog = () => {
    if (selectFilePath.value && selectFiles[selectFilePath.value]) {
        currentFile.value = currentPreview.value
    } else if (selectFilePath.value && generalModes[selectFilePath.value] && generalModes[selectFilePath.value]?.length > 0) {
        currentFile.value = currentPreview.value
    } else {
        currentFile.value = currentFolder
    }
    Object.keys(currentFile.value).forEach((key) => {
        currentFileEdit[key] = JSON.parse(JSON.stringify(currentFile.value[key]))
    })
    editShow.value = true
}

// 关闭编辑弹窗
const closeEdit = () => {
    editShow.value = false
}

// // 创建文件数据
// const createFileData = (fileName: string, jsonData: any) => {
//     fs.writeFileSync(fileName, jsonData)
// }

// // 新增文件夹
// const addFolder = () => {
//     fs.mkdir(`${config.path}/${folderName}`, (err) => {
//         if (err) {
//             console.log(err)
//             if (err.toString().includes('file already exists')) alert('文件名已存在')
//             else alert(err)
//         }
//         print()
//     })
// }
// 切换目录
const changeFolder = async () => {
    window.dialogApi
        .showOpenDialog({ properties: ['openDirectory'] })
        .then((res: any) => {
            let file = res.filePaths[0].split('\\').join('/')
            config.path = file
            rootPath.value = file
            const data = JSON.stringify(config, null, 4)
            window.fsApi.writeFile('config.json', data, 'utf-8', (err: any) => {
                if (err) throw err
                console.log('文件已被保存')
                print()
            })
        })
        .catch(() => {})
}
// 切换modes文件夹
const changeModesFolder = () => {
    window.dialogApi
        .showOpenDialog({ properties: ['openDirectory'] })
        .then((res: any) => {
            let file = res.filePaths[0].split('\\').join('/')
            console.debug(res, res.filePaths, file)
            config.modesPath = file
            modesPath.value = file
            const data = JSON.stringify(config, null, 4)
            window.fsApi.writeFile('config.json', data, 'utf-8', (err: any) => {
                if (err) throw err
                console.log('文件已被保存')
            })
        })
        .catch(() => {})
}
// 应用
const application = async () => {
    await deleteAllFilesInFolder(modesPath.value)
    console.debug('selectFiles', selectFiles)
    console.debug('generalModes', generalModes)
    Object.keys(selectFiles).forEach((key) => {
        if (selectFiles[key]) {
            if (selectFiles[key] && selectFiles[key].type === 'mode') {
                createLink(selectFiles[key])
            }
        }
    })
    Object.keys(generalModes).forEach((key) => {
        if (generalModes[key] && generalModes[key].length > 0) {
            generalModes[key].forEach((item: any) => {
                if (item.path) {
                    createLink(item)
                }
            })
        }
    })
}
// 创建软链接
const createLink = async (item: any) => {
    try {
        await window.fsApi.symlinkSync(item.path, `${modesPath.value}/${item.fileName}`, 'dir')
        console.log('创建软链接成功')
    } catch (err) {
        console.error('创建软链接出错:', err)
    }
}
// 关闭应用
const closeWin = () => {
    window.windowApi.close()
}
// 删除文件夹里面的软链接
const deleteAllFilesInFolder = async (folderPath: string) => {
    try {
        const files = await window.fsApi.readdirSync(folderPath)
        for (const file of files) {
            const filePath = window.pathApi.join(folderPath, file)
            // 检查文件是否是软链接
            // let stats = await fs.lstatSync(filePath)
            if (window.fsApi.isSymbolicLink(filePath)) {
                await window.fsApi.unlinkSync(filePath)
            }
        }
        console.log('所有文件已删除')
    } catch (err) {
        console.error('删除文件出错:', err)
    }
}
</script>

<template>
    <div class="container drag">
        <div class="header">
            <div class="header__left">
                <div class="header__left-close nodrag" @click.stop="closeWin">X</div>
                We are using Node.js <span id="node-version"></span>, Chromium <span id="chrome-version"></span>, and Electron <span id="electron-version"></span>.
            </div>
            <div class="header__right">
                <span>{{ rootPath }}</span>
                <div class="header__right-item nodrag" @click="changeFolder">切换目录</div>
                <span>{{ modesPath }}</span>
                <div class="header__right-item nodrag" @click="changeModesFolder">切换modes目录</div>
                <!-- <button @click="addFolder">新建文件夹</button>
                        <div>
                            <input type="text" v-model="folderName" placeholder="请输入文件夹名字" />
                        </div> -->
            </div>
        </div>
        <div class="main">
            <div class="folder nodrag">
                <div class="folder-title">文件夹</div>
                <div class="folder-list">
                    <div class="folder-item" :class="{ 'folder-item_active': currentFolder.name === item.name }" v-for="(item, i) in rootFolders" :key="i" @click="changeContent(item, true)">
                        <div class="folder-item-name">{{ item.name }}</div>
                    </div>
                </div>
            </div>
            <div class="file nodrag">
                <div class="file-title">
                    <template v-for="(item, index) in preFolder" :key="index"
                        ><span class="file-title-separate" v-if="index !== 0">/</span><span class="file-title-link" @click.stop="fileGoBack(item)">{{ item.name }}</span></template
                    >
                </div>
                <div class="file-container">
                    <div class="file-list">
                        <div
                            class="file-list-item"
                            v-for="(item, i) in folderContent"
                            :key="i + item.cover"
                            :class="{
                                border_folder: item.type === 'folder',
                                border_file: item.type === 'file',
                                border_pic: item.type === 'pic',
                                border_mode: item.type !== 'pic' && item.type !== 'file',
                                border_modes: item.type === 'modes',
                                border_active: filterActiveFile(item),
                                'file-list-item_img': item.type === 'pic',
                                'file-list-item_file': item.type !== 'folder',
                                'file-list-item_select': currentClick.name === item.name,
                            }"
                            @click.stop="selectFile(item)"
                        >
                            <div class="file-list-item-cover" v-if="item.type !== 'file' && item.type !== 'pic'" :style="{ 'background-image': `url('${filterImgPath(item.cover)}')` }"></div>
                            <!-- <img class="file-list-item-img" v-if="item.type === 'pic'" :src="item.path" /> -->
                            <div class="file-list-item-cover" v-if="item.type === 'pic'" :style="{ 'background-image': `url(${filterImgPath(item.path)})` }"></div>

                            <div class="file-list-item-name" v-if="item.type === 'file'">{{ item.fileName }}</div>
                            <div class="file-list-item-msg" v-if="item.type !== 'file'">
                                <div class="file-list-item-name">{{ item.fileName }}</div>
                                <div class="file-list-item-tag" v-if="item.type !== 'folder'">{{ item.name }}</div>
                                <div class="file-list-item-desc" v-if="item.type !== 'pic' && item.desc">{{ item.desc }}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="folderContent.length === 0">暂无文件</div>
            </div>
            <div class="edit nodrag">
                <div class="edit-title">{{ currentPreview.name }}</div>
                <div class="edit-cover" v-if="currentPreview.cover" :style="{ 'background-image': `url(${filterImgPath(currentPreview.cover)})` }"></div>
                <div class="edit-form">
                    <div class="edit-form-label">文件夹类型</div>
                    <div class="edit-form-item edit-type">{{ fileType[currentPreview.type] }}</div>
                    <div class="edit-form-label">{{ currentPreview.type !== 'folder' ? 'MODE描述' : '文件夹描述' }}</div>
                    <div class="edit-form-item">{{ currentPreview.desc }}</div>
                    <div class="edit-form-label" v-if="isModeType2">MODE来源URL</div>
                    <div class="edit-form-item" v-if="isModeType2">{{ currentPreview.url }}</div>
                    <div class="edit-form-label" v-if="isModeType2">MODE评分</div>
                    <div class="edit-form-item" v-if="isModeType2">{{ currentPreview.score }}</div>
                    <div class="edit-form-label" v-if="isModeType2 && currentPreview.keys && currentPreview.keys.length">快捷键</div>
                    <template v-if="isModeType2">
                        <div class="edit-form-item edit-form-item_key" v-for="(key, keyIndex) in currentPreview.keys" :key="keyIndex">
                            <div class="edit-form-item_key-name">{{ key[0] }}</div>
                            <div class="edit-form-item_key-val">{{ key[1] }}</div>
                        </div>
                    </template>
                    <div class="edit-btns">
                        <div class="edit-btn" @click="showEditDialog">编辑</div>
                        <div class="edit-btn" v-if="currentPreview.type === 'modes' && currentPreview.path !== currentFolder.path" @click.stop="openModesFolder">打开</div>
                    </div>
                    <!-- <pre style="white-space: pre-wrap; overflow: hidden; word-wrap: break-word;">{{ JSON.stringify(currentPreview, null, 4) }}</pre> -->
                </div>
            </div>
        </div>
        <div class="footer">
            <div class="footer-application nodrag" @click.stop="application">应用</div>
        </div>
        <EditDialog :editShow="editShow" :currentFileEdit="currentFileEdit" :isModeType="isModeType" :currentFile="currentFile" @closeEdit="closeEdit"></EditDialog>
    </div>
</template>

<style lang="scss" scoped></style>
