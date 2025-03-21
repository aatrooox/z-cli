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
               // 数据字典初始化
               dictionariesConfig: [
                   {
                       dictType: 'constant', // 常量
                       dictKey: ['IfpfItemType.getList2']
                   },
               ],
               constantsConfig: ['IfpfItemType'],
           };
       }
   };
</script>
<style lang="scss" scoped>
.query-selector {
   display: flex;
   //width: 100%;
   background-color: #ffffff;
   padding: 10px;
   gap: 10px;
   .query-item {
       display: flex;
       align-items: center;
       .name {
           width: 110px;
       }
   }
}



</style>

<style lang="scss" scoped>
.el-picker-panel {
   &.disable-year-selection {
       ::v-deep .el-picker-panel__body {
           ::v-deep .el-date-picker__header {
               display: none!important;
           }

           ::v-deep .el-date-picker__header--bordered {
               display: none!important;
           }
       }
   }
}

::v-deep .vxe-table--header {
   .vxe-cell {
       border-left: none !important;
   }
}
::v-deep .vxe-table {
   .vxe-table--body,
   .vxe-table--footer,
   .vxe-table--header {
       border-collapse: collapse !important;
   }
}
::v-deep .vxe-table.border--full {
   .vxe-header--column,
   .vxe-footer--column,
   .vxe-body--column {
       box-sizing: border-box;
       border: 1px solid #cccccc !important;
       height: 36px !important;
       padding: 0;
   }
}
::v-deep .col--ellipsis {
   .vxe-cell {
       height: auto;
       max-height: unset !important;
       white-space: pre !important;
       word-break: break-all !important;
       .vxe-cell--title {
           white-space: pre !important;
       }
   }
}
</style>


