import * as Cesium from 'cesium'
/**
 * 类初始化openIndexDb即可使用
 */
class CacheUrlClass {
  dataBaseName = 'cbcMapDatabase'
  tileStoreName = 'cbcCesiumUrlStore'
  isCache = false //是否全缓存
  option = {
    cacheUrl: [] //若无该配置或者长度为0则全缓存，否则只缓存配置的url
  }

  constructor(option) {
    this.option = option
    if (!this.option.cacheUrl || this.option.cacheUrl.length == 0) {
      this.isCache = true //全缓存
    }
  }

  /**
   * 判定缓存的地址
   * @param {*} url
   * @returns
   */
  shouldSave(url) {
    return this.option.cacheUrl.some((domain) => {
      return url.includes(domain)
    })
  }

  //覆盖Cesium请求方法
  updateCesiumFun() {
    let the = this
    let originalLoadWithXhr = Cesium.Resource._Implementations.loadWithXhr
    Cesium.Resource._Implementations.loadWithXhr = async function (url, responseType, method, data, headers, deferred, overrideMimeType) {
      //逻辑判断缓存-start（注:每次都需执行判断）
      if (!the.isCache) {
        //部分缓存,判定缓存的地址
        if (!the.shouldSave(url)) {
          return originalLoadWithXhr(url, responseType, method, data, headers, deferred, overrideMimeType)
        }
      }

      let promiseTemp = await the.findInIndexDB(url)
      //console.log("loadWithXhr--promiseTemp", promiseTemp);
      if (promiseTemp && promiseTemp.value) {
        if (promiseTemp.value == '404') {
          return deferred?.resolve(null)
        } else {
          if (deferred?.resolve) {
            return deferred?.resolve(promiseTemp.value)
          } else {
            originalLoadWithXhr(url, responseType, method, data, headers, deferred, overrideMimeType)
          }
        }
      } else {
        let xhr = originalLoadWithXhr(url, responseType, method, data, headers, deferred, overrideMimeType)
        if (deferred?.promise) {
          // 调用原始的loadImage函数
          //console.log("deferred?.promise", deferred?.promise);
          deferred?.promise
            .then((data) => {
              //console.log("data1111", data);
              the.addToIndexDB(url, data)
            })
            .catch((error) => {
              //console.error(`cbc-Error loading tile ${url}:`, error);
              if (error.statusCode == 404) {
                the.addToIndexDB(url, '404')
              }
              return null
            })
        }
        return xhr
      }
    }
  }
  async openIndexDb() {
    this.getIndexedDBUsage()
    let the = this
    return new Promise((resolve, reject) => {
      console.log('cbc-openIndexDb')
      const request = indexedDB.open(this.dataBaseName, 1)
      request.onerror = (event) => {
        console.error('数据库打开失败:', event.target.error)
        reject(event.target.error)
      }
      request.onsuccess = (event) => {
        the.tileIndexDb = event.target.result
        console.log('indexDB数据库打开成功')
        //更新Cesium请求方法
        the.updateCesiumFun()
        resolve(the.tileIndexDb)
      }
      request.onupgradeneeded = (event) => {
        the.tileIndexDb = event.target.result
        if (!the.tileIndexDb.objectStoreNames.contains(this.tileStoreName)) {
          const store = the.tileIndexDb.createObjectStore(this.tileStoreName, { keyPath: 'urlID' })
          store.createIndex('urlIDIndex', 'urlID', { unique: false })
        }
      }
    })
  }

  async addToIndexDB(keyParam, value) {
    //console.log("addToIndexDB--开始入库--keyParam, value", keyParam, value);
    let the = this
    if (the.tileIndexDb && the.tileIndexDb.objectStoreNames.contains(the.tileStoreName)) {
      const transaction = this.tileIndexDb.transaction(this.tileStoreName, 'readwrite')
      const store = transaction.objectStore(this.tileStoreName)
      let obj = {}
      obj.urlID = keyParam
      obj.value = value
      const request = store.add(obj)
      request.onsuccess = () => {
        //console.log("数据添加成功")
      }
      request.onerror = (e) => {
        //console.error('添加失败:', keyParam)
        //console.error('添加失败:', e.target.error)
      }
    }
  }
  async findInIndexDB(keyParam) {
    // console.log("findInIndexDB--keyParam", keyParam);
    let the = this
    if (the.tileIndexDb && the.tileIndexDb.objectStoreNames.contains(the.tileStoreName)) {
      return new Promise((resolve, reject) => {
        const transaction = the.tileIndexDb.transaction(the.tileStoreName, 'readonly')
        const store = transaction.objectStore(the.tileStoreName)
        let request = store.get(keyParam)
        request.onsuccess = () => {
          //console.log("findInIndexDB--request.result", request.result);
          resolve(request.result)
        }
        request.onerror = () => reject(request.error)
      })
    }
  }
  getIndexedDBUsage = () => {
    console.log('cbc-getIndexedDBUsage',navigator)
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimation = navigator.storage.estimate()
        estimation.then((result) => {
          //console.log("getIndexedDBUsage--result", result);
          let quota = result.quota
          let usage = result.usage
          console.log(`缓存总配额: ${(quota / 1024 / 1024).toFixed(2)} MB`)
          console.log(`缓存已使用: ${(usage / 1024 / 1024).toFixed(2)} MB`)
        })
      } catch (error) {
        console.error('获取存储估计失败:', error)
      }
    } else {
      console.warn('StorageManager API 不支持')
      return null
    }
  }
}
export default CacheUrlClass
