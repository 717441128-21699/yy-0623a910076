export default defineAppConfig({
  pages: [
    'pages/inventory/index',
    'pages/order/index',
    'pages/receive/index',
    'pages/mine/index',
    'pages/scan/index',
    'pages/product-detail/index',
    'pages/order-detail/index',
    'pages/create-order/index',
    'pages/receive-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '牙科耗材管家',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f5f7fa'
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#00a8cc',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/inventory/index',
        text: '今日库存'
      },
      {
        pagePath: 'pages/order/index',
        text: '订货单'
      },
      {
        pagePath: 'pages/receive/index',
        text: '到货验收'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
