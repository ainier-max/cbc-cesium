//水情监测图标
import regimenImgOutline from './images/layer/regimenImgOutline.png'
import regimenImgBlue from './images/layer/regimenImgBlue.png'
import regimenImgYellow from './images/layer/regimenImgYellow.png'
import regimenImgOrange from './images/layer/regimenImgOrange.png'
import regimenImgRed from './images/layer/regimenImgRed.png'
import regimenImgNomal from './images/layer/regimenImgNomal.png'
//土壤墒情图标
import soilContentImgOutline from './images/layer/soilContentImgOutline.png'
import soilContentImgBlue from './images/layer/soilContentImgBlue.png'
import soilContentImgYellow from './images/layer/soilContentImgYellow.png'
import soilContentImgOrange from './images/layer/soilContentImgOrange.png'
import soilContentImgRed from './images/layer/soilContentImgRed.png'
import soilContentImgNomal from './images/layer/soilContentImgNomal.png'
export function getImgURL(item) {
  let imgUrl
  //水情监测图标
  if (item.type == 'regimenLayer') {
    if (item.state == 'outline') {
      imgUrl = regimenImgOutline
    } else if (item.state == 'blue') {
      imgUrl = regimenImgBlue
    } else if (item.state == 'yellow') {
      imgUrl = regimenImgYellow
    } else if (item.state == 'orange') {
      imgUrl = regimenImgOrange
    } else if (item.state == 'red') {
      imgUrl = regimenImgRed
    } else {
      imgUrl = regimenImgNomal
    }
  }
  //土壤墒情图标
  if (item.type == 'soilContentLayer') {
    if (item.state == 'outline') {
      imgUrl = soilContentImgOutline
    } else if (item.state == 'blue') {
      imgUrl = soilContentImgBlue
    } else if (item.state == 'yellow') {
      imgUrl = soilContentImgYellow
    } else if (item.state == 'orange') {
      imgUrl = soilContentImgOrange
    } else if (item.state == 'red') {
      imgUrl = soilContentImgRed
    } else {
      imgUrl = soilContentImgNomal
    }
  }
  return imgUrl
}
