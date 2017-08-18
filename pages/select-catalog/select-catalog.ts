import { Component, Output, Input, EventEmitter, SimpleChanges, OnChanges, ChangeDetectorRef} from '@angular/core';
import { NavController, Events } from 'ionic-angular';
import { ResourcePersonDirectory } from "../resource-person-directory/resource-person-directory";
import { HttpService } from '../../services/http-service/http.service';
declare var window: any;
@Component({
    selector: 'page-select-catalog',
    templateUrl: 'select-catalog.html'
})
export class SelectCatalog implements OnChanges {
    @Output() intoEvent = new EventEmitter();
    @Output() dirId = new EventEmitter();
    @Output() openFlag = new EventEmitter();
    @Input('isIframe') isIframe: boolean;
    @Input('titleIndex') titleIndex: number = 1;
    @Input("cookieData") cookieData;
    fromIphone: number;
    catalogInfos: any;
    catalogInfo: any = [];
    catalogNum: any;
    catalogIds: any[] = new Array;
    catalogChildInfos: any;
    openCatalogStr: String = "全部展开";
    openCatalogAllflag: boolean = false;
    isFirst: boolean = true;
    isWindow: boolean;
    constructor(
        public navCtrl: NavController,
        public httpService: HttpService,
        public events: Events,
        public changeRef: ChangeDetectorRef, ) {
        this.fromIphone = window.platformType;

        this.catalogInfos = [

        ];
        //通过订阅事件更新目录
        this.events.subscribe("events:weikeData"||"events:updateCatalog", (data) => {
            this.getCatalogInfos("0");
        });
        // window.pier.js('biz.resource.refreshCatalog', () => {
        //     this.isWindow = true;
        //     // setTimeout(() => {
        //     this.getCatalogInfos("0");
        //     // }, 10);

        // });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.titleIndex == 1) {
            this.getCatalogInfos("0");
        }
    }

    getCatalogInfos(dirId: string) {
        this.httpService.postService('/resource/dir/queryTree', {
            'dirId': dirId,
            'repository': 'PERSON',
            'level': 2
        }, (response) => {
            if (response && response.content) {
                this.catalogInfos = response.content;
                if (this.catalogInfos.length > 0) {
                    if (window.person && window.person.openCatalogAll) {
                        this.openCatalogStr = "全部折叠";
                        for (let i = 0; i < this.catalogInfos.length; i++) {
                            this.catalogInfos[i].open = window.person.openCatalogAll;
                        }
                    }
                    // this.isFirst = false;  刷新后也默认记住选择
                    let catalogIndex = 0;
                    for (let i = 0; i < this.catalogInfos.length; i++) {
                        if (this.catalogInfos[i].id == (window.person && window.person.parentId)) {
                            catalogIndex = i;
                        }
                        this.catalogIds = this.catalogIds.concat(this.catalogInfos[i].id);
                        for (let j = 0; j < this.catalogInfos[i].children.length; j++) {
                            this.catalogIds = this.catalogIds.concat(this.catalogInfos[i].children[j].id);
                        }
                    }


                    this.catalogInfos[catalogIndex].open = true;
                    // this.catalogInfo=this.catalogInfos[catalogIndex];
                    let childIndex = -1;
                    for (let j = 0; j < this.catalogInfos[catalogIndex].children.length; j++) {
                        if (this.catalogInfos[catalogIndex].children[j].id == (window.person && window.person.childId)) {
                            childIndex = j;
                        }
                    }
                    if (childIndex < 0) {
                        this.selectCatalog(catalogIndex);
                    } else {
                        this.selectcatalogChild(catalogIndex, childIndex);
                    }

                    // this.dirId.emit({
                    //     "dirId": this.catalogInfos[catalogIndex].id,
                    //     "fatherId": this.catalogInfos[catalogIndex].id,
                    //     "childrenId": null,
                    //     "fatherDirName": this.catalogInfos[catalogIndex].dirName,
                    //     "childrenDirName": null,
                    // });

                }
                this.httpService.postService('/resource/person/countDirRes', {
                    'dirIds': this.catalogIds,
                }, (response) => {
                    for (let i = 0; i < response.content.length; i++) {
                        this.catalogInfos[i]["sumRes"] = response.content[i].weikeNum + response.content[i].questionNum;
                        for (let j = 0; j < response.content[i].children.length; j++) {
                            this.catalogInfos[i].children[j]["sumRes"] = response.content[i].children[j].weikeNum + response.content[i].children[j].questionNum;
                        }
                    }
                });
            }
            // if (this.isWindow) {
            //     this.isWindow = false;
            //     this.changeRef.markForCheck();
            //     this.changeRef.detectChanges();
            // }
        });
    }

    /**
     * 展开全部
     */
    openCatalogAll() {
        this.openCatalogAllflag = !this.openCatalogAllflag;
        for (let i = 0; i < this.catalogInfos.length; i++) {
            this.catalogInfos[i].open = this.openCatalogAllflag;
        }
        if (this.openCatalogAllflag) {
            this.openCatalogStr = "全部折叠";
            this.openFlag.emit({
                "openCatalogAll": true
            });
        } else {
            this.openCatalogStr = "全部展开";
            this.openFlag.emit({
                "openCatalogAll": false
            });
        }
    }
    selectCatalog(i) {
        // this.catalogInfos[i].select = !this.catalogInfos[i].select;
        this.catalogInfo = this.catalogInfos[i];
        this.dirId.emit({
            "dirId": this.catalogInfos[i].id,
            "fatherId": this.catalogInfos[i].id,
            "childrenId": null,
            "fatherDirName": this.catalogInfos[i].dirName,
            "childrenDirName": null,
        });
        // this.openCatalog(i);
    }
    /**
     * 
     * @param i 打开单个目录
     */
    openCatalog(i: number) {
        this.catalogInfos[i].open = !this.catalogInfos[i].open;
        // if( this.catalogInfos[i].children.length>0){
        //     this.catalogInfo=this.catalogInfos[i].children[0];
        // }
        // if (!this.catalogInfos[i].childList) {
        //     this.catalogInfos[i].childList = [];
        //     if (this.catalogChildInfos && this.catalogChildInfos.length > 0) {
        //         this.catalogInfos[i].childList = this.catalogChildInfos;
        //     }
        // }
    }
    selectcatalogChild(i, j) {
        this.catalogInfo = this.catalogInfos[i].children[j];
        this.dirId.emit({
            "dirId": this.catalogInfos[i].children[j].id,
            "fatherId": this.catalogInfos[i].id,
            "childrenId": this.catalogInfos[i].children[j].id,
            "fatherDirName": this.catalogInfos[i].dirName,
            "childrenDirName": this.catalogInfos[i].children[j].dirName,
        });
    }
    manageDir() {
        if (this.isIframe) {
            this.intoEvent.emit({
                "index": '1'
            });
        } else {
            this.navCtrl.push(ResourcePersonDirectory);
        }

    }
}