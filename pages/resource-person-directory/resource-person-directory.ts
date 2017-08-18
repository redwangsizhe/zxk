import { Component, Output, Input, EventEmitter } from '@angular/core';
import { AlertController, NavController, } from 'ionic-angular';
import { ItemSliding } from 'ionic-angular';
import { HttpService } from '../../services/http-service/http.service';
import { ResourcePersonDirectoryList } from "../resource-person-directory-list/resource-person-directory-list";
import { ToastService } from '../../services/toast-service/toast.service';
declare var window: any;
@Component({
  selector: 'page-resource-person-directory',
  templateUrl: 'resource-person-directory.html'
})
export class ResourcePersonDirectory {
  @Output() intoEvent = new EventEmitter;
  @Input('isIframe') isIframe: boolean;
  Dirlist: any;
  fromIphone: number;
  page: number = 1;
  returnDirId: any = null;
  isSwipeId: any;

  constructor(
    public navCtrl: NavController,
    private alertCtrl: AlertController,
    public httpService: HttpService,
    private toastService: ToastService, ) {
    this.fromIphone = window.platformType;
    this.getDirpList("0", 1);
  }
  //进入页面就获取数据
  ionViewDidEnter() {
    if (this.fromIphone != 1) {
      this.getDirpList("0", 1);
    }
  }

  getDirpList(pid: string, page: number) {

    this.httpService.postService('/resource/person/listDir', {
      'pid': pid,
      'page': page,
    }, (response) => {
      if (page == 1) {
        this.Dirlist = [];
      }
      if (response && response.content) {
        this.Dirlist.push.apply(this.Dirlist, response.content);
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
  addDir(name: string) {
    this.httpService.postService('/resource/person/addDir', {
      'name': name,
    }, (response) => {
      if (response && response.content) {
        this.getDirpList("0", 1);
        this.returnDirId = response.content;
      }
    });
  }
  reDir(dirId: number, dirName: string) {
    this.httpService.postService('/resource/dir/rename', {
      'dirId': dirId,
      "dirName": dirName
    }, (response) => {
      if (response && response.content) {
        this.getDirpList("0", 1);
      }
    });
  }

  doInfinite(infiniteScroll) {
    setTimeout(() => {
      this.getDirpList("0", ++this.page);
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
    if (this.Dirlist) {
      for (let i = 0; i < this.Dirlist.length; i++) {
        if (this.Dirlist[i].resDirctoryList.id == this.isSwipeId) {
          isShow = true;
        }
      }
    }

    return isShow
  }

  doPrompt() {
    if (this.dirBtnIsShow()) {
      return false
    }

    this.returnDirId = null;
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
              this.addDir(this.stripscript(prompt.data.inputs[0].value));

            } else {
              prompt.data.inputs[0].value = this.stripscript(prompt.data.inputs[0].value);
              this.toastService.setToast('只能输入30个汉字、字母、数字或部分特殊符号“空格、.（）[]-_”。');
              return false;
            }
          }
        }
      ]
    });
    prompt.present();
  }
  removeItem(item) {
    if (item.dirNum == 0 && item.resNum == 0) {
      this.delDir(item.resDirctoryList.id)
      for (let i = 0; i < this.Dirlist.length; i++) {

        if (this.Dirlist[i] == item) {
          this.Dirlist.splice(i, 1);
        }

      }
    } else {
      let alert = this.alertCtrl.create({
        message: '这个目录/子目录下有资源，请先删除资源再删除目录。',
        buttons: ['知道了'],
        cssClass: this.fromIphone == 0 ? "delDir" : "delDir mb",
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
  intoCatalog() {
    if (this.isIframe) {
      this.intoEvent.emit({
        "index": '0'
      });
    }
  }
  //关闭操作按钮
  closeBtn(event) {
    this.isSwipeId = null;
  }
  tzDir(i) {
    if (this.fromIphone != 0) {
      if (this.dirBtnIsShow()) {
        return false
      }
      for (let dir of this.Dirlist) {
        if (this.isSwipeId == dir.resDirctoryList.id) {
          this.isSwipeId = null;
        }
      }
      if (this.isSwipeId == null) {
        if (this.isIframe) {
          this.intoEvent.emit({
            "index": '2',
            "dirP": this.Dirlist[i]
          });
        } else {
          this.navCtrl.push(ResourcePersonDirectoryList, {
            "dirP": this.Dirlist[i]
          });
        }
      }
    } else {
      if (this.isIframe) {
        this.intoEvent.emit({
          "index": '2',
          "dirP": this.Dirlist[i]
        });
      } else {
        this.navCtrl.push(ResourcePersonDirectoryList, {
          "dirP": this.Dirlist[i]
        });
      }
    }

  }
  //滑动事件
  swipe(event, i) {
    if (event.direction != 4 && i != 0 && (event.angle > 150 || event.angle < -150)) {
      this.isSwipeId = this.Dirlist[i].resDirctoryList.id;
    } else {
      // this.isSwipeId = null;
    }
  }
}