<!-- SettingDialog -->
<script setup lang="ts">
import { defineEmits, defineProps, ref } from 'vue';

const { step, maxNum, modelValue, selectColor } = defineProps({
    step: {
        type: Number,
        default: 5,
    },
    maxNum: {
        type: Number,
        default: 100,
    },
    modelValue: {
        type: Number,
        default: 0,
    }, // 接收父组件传递的 modelValue 属性
    color: {
        type: String,
        default: 'rgb(254, 209, 80)',
    },
    selectColor: {
        type: String,
        default: 'rgb(254, 209, 80)',
    },
});

const emit = defineEmits(['update:modelValue']);
const currentVal = ref(0);
const changeValue = (num: number) => {
    currentVal.value = filterVal(num);
    emit('update:modelValue', filterVal(num)); // 发出 update:modelValue 事件更新父组件的数据
};
const filterVal = (num: number) => {
    return (maxNum / step) * num;
};
</script>

<template>
    <div class="star-score" :style="{ '--star-color': selectColor, '--star-active-color': color }">
        <!-- <div style="margin-right: 5px;">{{ modelValue }}</div> -->
        <div class="star-score-item" v-for="(num, index) in step" :key="index">
            <span
                class="iconfont"
                :class="{
                    'icon-star': modelValue < filterVal(num) || modelValue === 0,
                    'icon-star-full': modelValue >= filterVal(num),
                }"
                @click.stop="changeValue(num)"
            ></span>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@use './index.scss';
</style>
