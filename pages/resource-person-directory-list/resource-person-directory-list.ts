import { Component, Output, Input, EventEmitter } from '@angular/core';
import { AlertController, NavController, NavParams, Platform } from 'ionic-angular';
import { ItemSliding } from 'ionic-angular';
import { HttpService } from '../../services/http-service/http.service';
import { ToastService } from '../../services/toast-service/toast.service';
declare var window: any;
@Component({
  selector: 'page-resource-person-dir-list',
  templateUrl: 'resource-person-directory-list.html'
})
export class ResourcePersonDirectoryList {
  @Output() intoEvent = new EventEmitter;
  @Input('isIframe') isIframe: boolean;
  @Input('dirP') dirP: any;
  DircList: any;
  fromIphone: number;
  page: number = 1;
  isSwipeId: any;

  constructor(
    public navCtrl: NavController,
    private alertCtrl: AlertController,
    public navParams: NavParams,
    public httpService: HttpService,
    public platform: Platform,
    private toastService: ToastService, ) {
    platform.ready().then(() => {
      this.fromIphone = window.platformType;

      if (!this.isIframe) {
        this.dirP = navParams.get('dirP');
      }
      this.getDircList(this.dirP.resDirctoryList.id, 1);
    });

  }
  //返回事件
  intoDirp() {
    this.intoEvent.emit({
      "index": '1'
    });
  }

  getDircList(pid: string, page: number) {
    this.httpService.postService('/resource/person/listDir', {
      'pid': pid,
      'page': page,
    }, (response) => {
      if (page == 1) {
        this.DircList = [];
      }
      if (response && response.content) {
        this.DircList.push.apply(this.DircList, response.content);
      }
    });
  }
  delDir(dirId: string) {
    this.httpService.postService('/resource/person/deleteDir', {
      'dirId': dirId,
    }, (response) => {
      if (response && response.content) {
      }
    });
  }
  addDir(name: string, pid: string) {
    this.httpService.postService('/resource/person/addDir', {
      'name': name,
      'pid': pid,
    }, (response) => {
      if (response && response.content) {
        this.getDircList(this.dirP.resDirctoryList.id, 1);
      }
    });
  }
  reDir(dirId: number, dirName: string) {
    this.httpService.postService('/resource/dir/rename', {
      'dirId': dirId,
      "dirName": dirName
    }, (response) => {
      if (response && response.content) {
        this.getDircList(this.dirP.resDirctoryList.id, 1);
      }
    });
  }

  doInfinite(infiniteScroll) {
    setTimeout(() => {
      this.getDircList(this.dirP.resDirctoryList.id, ++this.page);
      infiniteScroll.complete();
    }, 500);
  }

  stripscript(s) {
    var pattern = new RegExp("[`~!@#$^&*%+=|{}':;',\\\\<>/?~！@#￥……&*|{}【】‘；：'，？]");
    var rs = "";
    for (var i = 0; i < s.length; i++) {
      rs = rs + s.substr(i, 1).replace(pattern, '');
    }
    return rs;
  }
  dirBtnIsShow() {
    let isShow;
    for (let i = 0; i < this.DircList.length; i++) {
      if (this.DircList[i].resDirctoryList.id == this.isSwipeId) {
        isShow = true;
      }
    }
    return isShow
  }
  doPrompt() {
    if (this.dirBtnIsShow()) {
      return false
    }
    let prompt = this.alertCtrl.create({
      title: "新建文件夹",
      cssClass: this.fromIphone == 0 ? "alertCss" : "alertCss mb",
      inputs: [
        {
          name: "create",
          placeholder: "请输入文件夹名称",
          type: "text",

        },
      ],
      buttons: [
        {
          text: "取消",
          handler: data => {
          }
        },
        {
          text: "确定",
          handler: data => {
            // this.stripscript()
            let old_value = prompt.data.inputs[0].value;
            let new_value = this.stripscript(prompt.data.inputs[0].value);
            if (old_value == new_value && new_value.length != 0 && new_value.length < 31) {
              //
              this.addDir(this.stripscript(prompt.data.inputs[0].value),
                this.dirP.resDirctoryList.id);
            } else {
              prompt.data.inputs[0].value = this.stripscript(prompt.data.inputs[0].value);
              this.toastService.setToast('只能输入30个汉字、字母、数字或部分特殊符号“空格、.（）[]-_”。');
              return false
            }
          }
        }
      ]
    });
    prompt.present();
  }
  removeItem(item) {

    if (item.resNum == 0) {
      for (let i = 0; i < this.DircList.length; i++) {
        this.delDir(item.resDirctoryList.id)
        if (this.DircList[i] == item) {
          this.DircList.splice(i, 1);
        }

      }
    } else {
      let alert = this.alertCtrl.create({
        message: '这个目录/子目录下有资源，请先删除资源再删除目录。',
        buttons: ['知道了'],
        cssClass: this.fromIphone == 0 ? "delDir" : "delDir mb"
      });
      alert.present();
    }

  }
  rechristen(item) {
    let prompt = this.alertCtrl.create({
      cssClass: this.fromIphone == 0 ? "alertCssR" : "alertCssR mb",
      inputs: [
        {
          placeholder: "请输入文件夹名称",
          value: item.resDirctoryList.dirName,
        },
      ],
      buttons: [
        {
          text: "取消",
          handler: data => {
          }
        },
        {
          text: "确定",
          handler: data => {
            let old_value = prompt.data.inputs[0].value;
            let new_value = this.stripscript(prompt.data.inputs[0].value);
            if (old_value == new_value && new_value.length != 0 && new_value.length < 31) {
              //
              this.reDir(item.resDirctoryList.id, this.stripscript(prompt.data.inputs[0].value));
            } else {
              prompt.data.inputs[0].value = this.stripscript(prompt.data.inputs[0].value);
              this.toastService.setToast('只能输入30个汉字、字母、数字或部分特殊符号“空格、.（）[]-_”。');
              return false
            }
          }
        }
      ]
    });
    prompt.present();
  }
  //滑动事件
  swipe(event, i) {
    if (event.direction != 4) {
      this.isSwipeId = this.DircList[i].resDirctoryList.id;
    } else {
      // this.isSwipeId = '-1';
    }
  }
  //关闭操作按钮
  closeBtn(event) {
    this.isSwipeId = '-1';
  }
}