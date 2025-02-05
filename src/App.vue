<script setup lang="ts">
import { computed, reactive, ref, toRaw } from 'vue';
// import { ipcRenderer, dialog } from 'electron'
// import path from 'path'
// import fs from 'fs'
import EditDialog from './components/EditDialog/index.vue';
import SettingDialog from './components/SettingDialog/index.vue';
import FileItem from './components/FileItem/index.vue';
import Preview from './components/Preview/index.vue'


let rootPath: any = ref(''); // 存放mode的源文件夹路径
let modesPath: any = ref(''); // mode加载器加载mode的文件夹路径
let bgImgPath: any = ref(''); // 背景图片路径
let rootFolders: any = reactive([]); // 一级目录
let folderContent: any = reactive([]); // 文件夹内容
// let folderName: any = ref('')
let currentFolder: any = reactive({}); // 当前点击的顶级文件夹
let currentFile: any = ref({}); // 当前选中的文件数据
let currentFileEdit: any = reactive({
    type: '',
    fileName: '',
    name: '',
    path: '',
    desc: '',
    score: 0,
    keys: [],
    url: '',
}); // 用来编辑的文件数据
let config: any = reactive({
    path: '',
    modesPath: '',
    bgImgPath: '',
});
let selectFiles: any = reactive({}); // 选中的文件
let preFolder: any = reactive([]); // 上级目录
let generalModes: any = reactive({}); // 通用mode
let currentClick: any = ref({}); // 当前点击的文件夹

const init = () => {
    // 获取全部配置
    window.fsApi.readFile('config.json', 'utf-8', (err: any, data: any) => {
        if (err) throw err;
        console.debug('获取config--', JSON.parse(data));
        let configData = JSON.parse(data) || {};
        Object.assign(config, configData);
        bgImgPath.value = configData.bgImgPath;
        modesPath.value = configData.modesPath;

        let previousPath = window.localStorage.getItem('rootPath') || '';
        // 路径没变，使用选中缓存
        if (previousPath === configData.path) {
            let selectFilesVal = window.localStorage.getItem('selectFiles');
            selectFiles = JSON.parse(selectFilesVal || '{}');
            let generalModesVal = window.localStorage.getItem('generalModes');
            generalModes = JSON.parse(generalModesVal || '{}');
        }
        if (config.path) {
            print();
        }
    });
};

init();

// 计算属性
const selectFilePath = computed(() => {
    let arr = preFolder.map((v: any) => v.fileName);
    return arr.join('/');
});


// methods
// 读取根目录文件
const print = async () => {
    const path = config.path;
    rootPath.value = path;
    window.localStorage.setItem('rootPath', path); // 用来进行取缓存判断
    const dir = await window.fsApi.readdirSync(path);

    rootFolders.splice(0, rootFolders.length); // 清除上一次的目录数据
    dir.forEach(async (fileName: string) => {
        let filePath = `${path}/${fileName}`;
        if (window.fsApi.isDirectory(filePath)) {
            let fileData: any = {
                type: 'firstFolder',
                name: fileName,
                path: filePath,
                fileName: fileName,
                desc: '',
            };
            let fileDataPath = `${filePath}/fileData.json`;
            // 检测是否已经生成过数据文件
            if (window.fsApi.existsSync(fileDataPath)) {
                let data = window.fsApi.readFileSync(fileDataPath, 'utf8');
                data = JSON.parse(data);
                // 处理读取移动过后的数据问题
                data.fileName = fileName;
                data.path = filePath;
                fileData = data;
            } else {
                fileData.cover = getFolderCover(filePath) || '';
                window.fsApi.writeFile(fileDataPath, JSON.stringify(fileData, null, 4), (err: any) => {
                    if (err) {
                        return console.error(err);
                    }
                    console.debug('一级目录创建fileData.json成功', fileData);
                });
            }
            rootFolders.push(fileData);
        }
    });
};

// 获取目录内文件
const getContent = (path: string) => {
    let flies = window.fsApi.readdirSync(path);
    let flieList: any = [];
    flies.forEach((fileName: string) => {
        let filePath = `${path}/${fileName}`;
        let fileDataPath = `${path}/${fileName}/fileData.json`;
        let type = 'folder';
        if (!window.fsApi.isDirectory(filePath)) {
            type = 'file';
            if (fileName.includes('.png') || fileName.includes('.jpg')) {
                type = 'pic';
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
        };

        if (type === 'folder') {
            // 检测是否已经生成过数据文件
            if (window.fsApi.existsSync(fileDataPath)) {
                // fileData
                let data = window.fsApi.readFileSync(fileDataPath, 'utf8');
                data = JSON.parse(data);
                // 处理读取移动过后的数据问题
                data.fileName = fileName;
                data.path = filePath;
                fileData = data;
            } else {
                fileData.cover = getFolderCover(filePath) || '';
                window.fsApi.writeFile(fileDataPath, JSON.stringify(fileData, null, 4), (err: any) => {
                    if (err) {
                        return console.error(err);
                    }
                    console.debug('文件夹创建fileData.json成功', fileData);
                });
            }
            flieList.push(fileData);
        }
    });
    console.debug('获取目录内文件--', flieList);
    return flieList;
};

// 获取文件夹封面
const getFolderCover = (path: string) => {
    let arr = window.fsApi.readdirSync(path);
    let url = '';
    arr.forEach((fileName: string) => {
        if (fileName.includes('.png') || fileName.includes('.jpg')) {
            url = `${path}/${fileName}`;
        }
    });
    return url;
};

/**
 * 切换当前打开的文件夹
 */
const changeContent = (item: any, clear?: boolean) => {
    console.debug('切换当前打开的文件夹--', toRaw(item));
    if (clear) {
        preFolder.splice(0, preFolder.length);
        preFolder.push(item);
        currentFile.value = {};
        currentClick.value = {};
    }
    setFiles(item);
};

// 返回上一级文件
const fileGoBack = (item: any) => {
    let index = preFolder.findIndex((v: any) => v.path === item.path);
    if (index !== -1) {
        preFolder.splice(index + 1, preFolder.length);
    }
    currentClick.value = {};
    setFiles(item);
};

// 设置文件夹内容
const setFiles = (item: any, sortFlag?: boolean) => {
    // sortFlag为true表示仅排序
    if (!sortFlag) {
        currentFolder = item;
        changeCurrentFile();
    }
    let files = getContent(item.path);
    files.sort((a: any, b: any) => {
        return b.score - a.score;
        if (a.type === 'mode') {
            if (b.type !== 'mode') {
                return -1;
            } else {
                return b.score - a.score;
            }
        }
        if (a.type === 'modes') {
            if (b.type === 'mode' || b.type === 'generalMode') {
                return 1;
            } else {
                if (b.type === 'folder') {
                    return -1;
                } else {
                    if (b.type === 'modes') {
                        return b.score - a.score;
                    }
                    return 0;
                }
            }
        }
        if (a.type === 'generalMode') {
            if (b.type !== 'mode') {
                return -1;
            } else {
                return 0;
            }
        }
        if (a.type === 'folder') {
            if (b.type !== 'folder') {
                return 1;
            } else {
                return 0;
            }
        }

        return 0;
    });
    folderContent = files;
};

const changeCurrentFile = () => {
    // 切换文件夹的时候当前选中项会变成从选中列表中取出来的，编辑后不会更新展示列表中的当前项，需要做特殊处理
    if (selectFilePath.value && selectFiles[selectFilePath.value]) {
        // 通用mode比modes文件夹回显优先级高的判断
        // if (selectFiles[selectFilePath.value].type === 'modes' && generalModes[selectFilePath.value] && generalModes[selectFilePath.value]?.length > 0) {
        //     currentFile.value = generalModes[selectFilePath.value][0]
        // } else {
        currentFile.value = selectFiles[selectFilePath.value];
        // }
    } else if (
        selectFilePath.value &&
        generalModes[selectFilePath.value] &&
        generalModes[selectFilePath.value]?.length > 0
    ) {
        currentFile.value = generalModes[selectFilePath.value][0];
    } else {
        currentFile.value = currentFolder;
    }
};

const clearSelectFile = () => {
    currentFile.value = {};
    changeCurrentFile();
};

// 选中文件夹
const selectFile = (item: any) => {
    currentClick.value = item;
    if (item.type !== 'file' && item.type !== 'pic') {
        // mode切换
        if (item.type === 'generalMode') {
            if (selectFilePath && generalModes[selectFilePath.value]) {
                let index = generalModes[selectFilePath.value].findIndex((v: any) => v.path === item.path);
                if (index === -1) {
                    generalModes[selectFilePath.value].push(item);
                    setCurrentFile(item);
                } else {
                    generalModes[selectFilePath.value].splice(index, 1);
                    clearSelectFile();
                }
            } else {
                generalModes[selectFilePath.value] = [item];
                setCurrentFile(item);
            }
        } else {
            if (selectFiles?.[selectFilePath.value]) {
                if (selectFiles[selectFilePath.value].path === item.path) {
                    selectFiles[selectFilePath.value] = null;
                    clearSelectFile();
                    // 取消选中的是mods文件夹，下面的mod也要取消选中
                    if (item.type === 'modes') {
                        Object.keys(selectFiles).forEach((key) => {
                            if (key.indexOf(selectFilePath.value + '/') === 0) {
                                selectFiles[key] = null;
                            }
                        });
                        // 清空里面的通用mode
                        Object.keys(generalModes).forEach((key) => {
                            if (key.indexOf(selectFilePath.value + '/') === 0) {
                                generalModes[key].splice(0,generalModes[key].length);
                            }
                        });
                    }
                } else {
                    selectFiles[selectFilePath.value] = item;
                    setCurrentFile(item);
                    // 选中的是上面的mod下面mods文件夹里面选中的也要取消掉
                    Object.keys(selectFiles).forEach((key) => {
                        if (key.indexOf(selectFilePath.value + '/') === 0) {
                            selectFiles[key] = null;
                        }
                    });
                    // 清空通用mode
                    Object.keys(generalModes).forEach((key) => {
                        if (key.indexOf(selectFilePath.value + '/') === 0) {
                            generalModes[key].splice(0,generalModes[key].length);
                        }
                    });
                }
            } else {
                selectFiles[selectFilePath.value] = item;
                setCurrentFile(item);
            }
        }
    }
};

// 设置当前选择文件数据
const setCurrentFile = (item: any) => {
    currentFile.value = item;
};

// 打开modes文件夹
const openModesFolder = () => {
    if(currentClick.value?.name) {
        preFolder.push(currentClick.value);
        changeContent(currentClick.value);
    } else {
        preFolder.push(currentFile.value);
        changeContent(currentFile.value);
    }
};

// 过滤选择
const filterActiveFile = (item: any) => {
    if (item.type === 'generalMode') {
        if (selectFilePath && generalModes[selectFilePath.value] && generalModes[selectFilePath.value]?.length > 0) {
            let index = generalModes[selectFilePath.value].findIndex((v: any) => v.path === item.path);
            return index !== -1;
        }
        return false;
    } else {
        if (selectFilePath.value && selectFiles[selectFilePath.value]?.path) {
            return selectFiles[selectFilePath.value]?.path === item.path;
        }
        return false;
    }
};

// 过滤背景图路径
const filterImgPath = (path: string) => {
    if (path) {
        return encodeURI(`file:///${path.split('\\').join('/')}`);
        // return encodeURI(`${path.split('\\').join('/')}`)
        // return `${path.split('\\').join('/')}`
    }
    return '';
};

// 过滤文件类型
// const filterFileType = (type: string) => {
//     return fileType[type]
// }

// 编辑弹窗相关 -- start
let editShow: any = ref(false);
const showEditDialog = () => {
    if(currentClick.value?.name) {
        Object.keys(currentClick.value).forEach((key) => {
            currentFileEdit[key] = JSON.parse(JSON.stringify(currentClick.value[key]));
        });
    } else {
        Object.keys(currentFile.value).forEach((key) => {
            currentFileEdit[key] = JSON.parse(JSON.stringify(currentFile.value[key]));
        });
    }
    editShow.value = true;
};
// 关闭弹窗
const closeEdit = () => {
    Object.keys(currentFileEdit).forEach((key) => {
        currentFileEdit[key] = '';
    });
    editShow.value = false;
};
// 确认修改
const confirmEdit = () => {
    // 更新当前文件列表，重新排序
    setFiles(currentFolder, true);
    closeEdit();
};
// 编辑弹窗相关 -- end

// // 创建文件数据
// const createFileData = (fileName: string, jsonData: any) => {
//     fs.writeFileSync(fileName, jsonData)
// }

// // 新增文件夹
// const addFolder = () => {
//     fs.mkdir(`${config.path}/${folderName}`, (err) => {
//         if (err) {
//             console.debug(err)
//             if (err.toString().includes('file already exists')) alert('文件名已存在')
//             else alert(err)
//         }
//         print()
//     })
// }

// 应用
const application = async () => {
    await deleteAllFilesInFolder(modesPath.value);
    console.debug('选中的文件夹--selectFiles', selectFiles);
    console.debug('通用mode--generalModes', generalModes);
    window.localStorage.setItem('selectFiles', JSON.stringify(selectFiles));
    window.localStorage.setItem('generalModes', JSON.stringify(generalModes));
    Object.keys(selectFiles).forEach((key) => {
        if (selectFiles[key]) {
            if (selectFiles[key] && selectFiles[key].type === 'mode') {
                createLink(selectFiles[key]);
            }
        }
    });
    Object.keys(generalModes).forEach((key) => {
        if (generalModes[key] && generalModes[key].length > 0) {
            generalModes[key].forEach((item: any) => {
                if (item.path) {
                    createLink(item);
                }
            });
        }
    });
    window.notificationApi.show({
        title:'mode应用',
        body:'应用mode成功'
    })
};
// 创建软链接
const createLink = async (item: any) => {
    try {
        await window.fsApi.symlinkSync(item.path, `${modesPath.value}/${item.fileName}`, 'dir');
        console.debug('创建软链接成功', `${modesPath.value}/${item.fileName}`);
    } catch (err) {
        console.error('创建软链接出错:', err);
    }
};

// 删除文件夹里面的软链接
const deleteAllFilesInFolder = async (folderPath: string) => {
    try {
        const files = await window.fsApi.readdirSync(folderPath);
        for (const file of files) {
            const filePath = window.pathApi.join(folderPath, file);
            // 检查文件是否是软链接
            // let stats = await fs.lstatSync(filePath)
            if (window.fsApi.isSymbolicLink(filePath)) {
                await window.fsApi.unlinkSync(filePath);
            }
        }
        console.debug('所有文件已删除');
    } catch (err) {
        console.error('删除文件出错:', err);
    }
};

// 设置弹窗--start
const settingShow = ref(false);
const showSetting = () => {
    settingShow.value = true;
};
const closeSetting = () => {
    settingShow.value = false;
};
// 切换存放mode的文件夹路径
const changeModesFolder = (file: string) => {
    rootPath.value = file;
    print();
};
// 切换mode加载器载入mode的文件夹路径
const changeModesLoadFolder = (file: string) => {
    modesPath.value = file;
};
// 切换背景图片
const changeBgImg = (file: string) => {
    bgImgPath.value = file;
};
// 设置弹窗--end

// 窗口相关--start
/**
 * 关闭窗口
 */
const closeWin = () => {
    window.windowApi.close();
};
const isFullScreen = ref(false);
/**
 * 切换全屏
 */
const changeFullScreen = () => {
    window.windowApi.changeFullScreen();
    isFullScreen.value = !isFullScreen.value;
};
/**
 * 最小化
 */
const minimize = () => {
    window.windowApi.minimize();
};
// 窗口相关--end
</script>

<template>
    <div class="container" :style="{ 'background-image': bgImgPath ? `url(${filterImgPath(bgImgPath)})` : '' }">
        <div class="container__mask drag">
            <div class="header">
                <div class="header__left">
                    <div class="header__left-close nodrag" @click.stop="closeWin" title="关闭">
                        <span class="iconfont icon-guanbi"></span>
                    </div>
                    We are using Node.js <span id="node-version"></span>, Chromium <span id="chrome-version"></span>,
                    and Electron <span id="electron-version"></span>.
                </div>
                <div class="header__right">
                    <div class="header__right-item min nodrag" @click.stop="minimize" title="最小化">
                        <span class="iconfont icon-zuixiaohua1"></span>
                    </div>
                    <div
                        class="header__right-item nodrag"
                        @click.stop="changeFullScreen"
                        :title="!isFullScreen ? '最大化' : '还原'"
                    >
                        <span
                            class="iconfont icon-zuidahua"
                            :class="{ 'icon-zuidahua': !isFullScreen, 'icon-zuixiaohua': isFullScreen }"
                        ></span>
                    </div>
                    <div class="header__right-item nodrag" @click.stop="showSetting" title="设置">
                        <span class="iconfont icon-shezhi"></span>
                    </div>
                    <!-- <div class="header__right-item nodrag" >设置</div> -->
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
                        <div
                            class="folder-item"
                            :class="{ 'folder-item_active': currentFolder.path && currentFolder.path.indexOf(item.path) === 0}"
                            v-for="(item, i) in rootFolders"
                            :key="i"
                            @click="changeContent(item, true)"
                        >
                            <div class="folder-item-name">{{ item.name }}</div>
                        </div>
                    </div>
                </div>
                <div class="file nodrag">
                    <div class="file-title">
                        <template v-for="(item, index) in preFolder" :key="index"
                            ><span class="file-title-separate" v-if="index !== 0">/</span
                            ><span class="file-title-link" @click.stop="fileGoBack(item)">{{
                                item.name
                            }}</span></template
                        >
                    </div>
                    <div class="file-container">
                        <div class="file-list" v-if="folderContent.length">
                            <FileItem
                                :class="{
                                    'file-item_active': currentClick.path === item.path,
                                }"
                                :selected="filterActiveFile(item)"
                                @click.stop="selectFile(item)"
                                v-for="(item, i) in folderContent"
                                :key="i"
                                :item="item"
                            ></FileItem>
                        </div>
                        <div class="file-empty" v-if="folderContent.length === 0">暂无文件</div>
                    </div>
                </div>
                
                <Preview :currentFile="currentClick.name ? currentClick : currentFile" :currentFolder="currentFolder" @showEditDialog="showEditDialog" @openModesFolder="openModesFolder"></Preview>
            </div>
            <div class="footer">
                <div class="footer-application nodrag" @click.stop="application">应用</div>
            </div>
            <!-- 设置弹窗 -->
            <SettingDialog
                :show.sync="settingShow"
                :config="config"
                @close="closeSetting"
                @changeModesFolder="changeModesFolder"
                @changeModesLoadFolder="changeModesLoadFolder"
                @changeBgImg="changeBgImg"
            ></SettingDialog>

            <!-- 编辑弹窗 -->
            <EditDialog
                :editShow="editShow"
                :folderContent="folderContent"
                :currentFileEdit="currentFileEdit"
                :currentFile="currentFile"
                @closeEdit="closeEdit"
                @confirmEdit="confirmEdit"
            ></EditDialog>
        </div>
    </div>
</template>

<style lang="scss" scoped></style>
