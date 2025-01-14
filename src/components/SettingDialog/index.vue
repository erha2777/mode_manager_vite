<!-- SettingDialog -->
<script setup lang="ts">
// import { reactive, ref } from 'vue'


const {  } = defineProps({
    
})

const emit = defineEmits(['closeEdit'])
// 关闭编辑弹窗
const closeEdit = () => {
    emit('closeEdit')
}

</script>

<template>
    <div class="dialog dialog_edit" >
        <div class="dialog__mask" @click="closeEdit"></div>
        <div class="dialog__body">
            12333
        </div>
    </div>
</template>

<style lang="scss" scoped>
@use './index.scss';
</style>
