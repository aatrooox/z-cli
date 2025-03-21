<template>
  <!--i18n addTitle=你好呀 a=不错   b=叭叭叭 c=哈哈哈  -->
  <CommonEditForm :page-type="pageType" :title-config="titleConfig" :custom-components-code="$t('i18n.monthlyForecast.pageTitle.addTitle')" :is-out="2">
    <div>{{ $t('i18n.monthlyForecast.form.a') }}</div>
    <div>{{ $t('i18n.monthlyForecast.form.b') }}</div>
    <!--i18n select=真棒 -->
    <div>{{ $t('i18n.monthlyForecast.placeholder.select') }}</div>
  </CommonEditForm>

</template>

<!-- js 区域 -->
<script>
   import {formatDate} from "@/common/utils"
   import CommonEditForm from "@/pages/ifpf/costForecast/monthlyForecast/views/common-edit-form.vue"

   export default {
       name: 'ifpfExchangeRateMaintainAdd',
       components:{
           CommonEditForm,
       },
       data() {
           return {
               pageType: 'edit',
               titleConfig: {
                   title: this.$t('i18n.monthlyForecast.pageTitle.addTitle'),//测试
                   icon: this.$t('i18n.monthlyForecast.pageTitle.icon'), // 图标
                   date: formatDate.formatDateOnly(new Date()),
                   info: this.$t('i18n.monthlyForecast.pageTitle.addInfo')//你好
               },
           };
       }
   };
</script>
