import {
  Component,
  ElementRef,
  ViewChild,
  OnInit
} from '@angular/core';
import {
  Chart,
  registerables
} from 'chart.js';
import {
  FichesClients,
  FichesClientsService
} from '../services/fiches-clients.service';
import {
  Capacitor
} from '@capacitor/core';
import {
  ElectronService
} from 'ngx-electron';
import {
  map,
  finalize
} from "rxjs/operators";
import {
  Observable
} from "rxjs";

import {
  Camera,
  CameraResultType,
  CameraSource,
  CameraDirection
} from '@capacitor/camera';
import {
  AngularFireStorage
} from "@angular/fire/storage";
import {
  AlertController
} from '@ionic/angular';
import {
  weekNumber
} from 'weeknumber';

Chart.register(...registerables);

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  @ViewChild('barCanvas') private barCanvas: ElementRef;
  @ViewChild('lineCanvas') private lineCanvas: ElementRef;

  barChart: any;
  lineChart: any;

  fichesClients: FichesClients[];
  ficheClient: any = [];
  isNativePlatform: boolean = false;
  base64Image: string;
  base64Image2: string;
  downloadURL: Observable < string > ;
  downloadURL2: Observable < string > ;
  fullName: string;
  numberOfWeek: number = weekNumber(new Date());
  openDetail: boolean = false;

  chartView: number = 1;
  customersViews:number = 0;
  customersViewsError:number = 0;

  constructor(
    private fichesClientsService: FichesClientsService,
    private electronService: ElectronService,
    private storage: AngularFireStorage,
    private alertCtrl: AlertController
  ) {}

  ionViewDidEnter() {
    if (Capacitor.isNativePlatform()) {
      //
    } else {

    }
  }

  ngOnInit() {

    if (Capacitor.isNativePlatform()) {

        this.isNativePlatform = true;

    } else {

        console.log('is not a native platform')

        this.fichesClientsService.getFichesClients().subscribe(res => {
          console.log(res)
          res.sort((a, b) => b.start - a.start)
          this.fichesClients = res;
        
  
        if (this.lineChart !== undefined && this.chartView === 2) {
          if (this.numberOfWeek === weekNumber(new Date())) {
            this.lineChart.destroy();
            this.lineChartMethod();
          }
        }
  
        if (this.barChart !== undefined && this.chartView === 0) {
          if (this.numberOfWeek === weekNumber(new Date())) {
            this.barChart.destroy();
            this.barChartMethod();
          }
        }

      });
    }

  }

  customerViewGoToOne(){
    this.customersViews = 1;
  }

  notMajor(){
    this.customersViewsError = 1;
    
    setTimeout(() => {
      window.location.reload();
    }, 3000)
  }

  openDetailModal(id: any) {
      if(this.openDetail === false){
        this.openDetail = true;
        this.fichesClientsService.getFicheClient(id).subscribe(res => {
          var ficheClient = res;

          this.storage.ref(res.identityCard).getDownloadURL().subscribe(res => {
            console.log(res)
            ficheClient.identityCard = res;
            console.log('okok')
          });     

          this.storage.ref(res.identityCard2).getDownloadURL().subscribe(res => {
            console.log(res)
            ficheClient.identityCard2 = res;
            console.log('okok')
            this.ficheClient = ficheClient;
            console.log(this.ficheClient)
          });         
        }); 
      }   
  }
  closeDetail() {
    this.openDetail = false;
  }


  async takePicture() {
    const image = await Camera.getPhoto({
      quality: 60,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      direction: CameraDirection.Front
    }).then(image => {
      this.base64Image = 'data:image/jpeg;base64,' + image.base64String;
    }).catch(error => {
      console.log({
        type: "CONSOLE ERROR",
        data: error
      })
    });

  };

  async takePicture2() {
    const image = await Camera.getPhoto({
      quality: 60,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      direction: CameraDirection.Front
    }).then(image => {
      this.base64Image2 = 'data:image/jpeg;base64,' + image.base64String;
    }).catch(error => {
      console.log({
        type: "CONSOLE ERROR",
        data: error
      })
    });

  };

  forceDownload(url, fileName){
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "blob";
    xhr.onload = function(){
        var urlCreator = window.URL || window.webkitURL;
        var imageUrl = urlCreator.createObjectURL(this.response);
        var tag = document.createElement('a');
        tag.href = imageUrl;
        tag.download = fileName;
        document.body.appendChild(tag);
        tag.click();
        document.body.removeChild(tag);
    }
    xhr.send();
  }

  updateFicheClient(){
    this.fichesClients.forEach( f => {    
      if(f.start.seconds === this.ficheClient.start.seconds &&
         f.start.nanoseconds === this.ficheClient.start.nanoseconds &&
         f.fullName === this.ficheClient.fullName){     
         f.end = new Date();
         f.conclude = this.ficheClient.conclude;
         this.fichesClientsService.updateFicheClient(f, f.id);
      }
    })
  }

  upload(): void {
    var currentDate = Date.now();

    const file: any = this.base64ToImage(this.base64Image);
    const filePath = `Images/recto_${currentDate}`;
    const fileRef = this.storage.ref(filePath);

    const file2: any = this.base64ToImage(this.base64Image2);
    const filePath2 = `Images/verso_${currentDate}`;
    const fileRef2 = this.storage.ref(filePath2);

    var date = new Date();
    const ficheClient: FichesClients = {
      start: date,
      end: date,
      fullName: this.fullName,
      identityCard: filePath,
      identityCard2: filePath2,
      conclude: false
    };

    const task = this.storage.upload(`Images/recto_${currentDate}`, file);
    task.snapshotChanges()
      .pipe(finalize(() => {
        this.downloadURL = fileRef.getDownloadURL();
        this.downloadURL.subscribe(downloadURL => {
          console.log(downloadURL);
        });
      }))
      .subscribe(url => {
        if (url) {
          console.log(url);
        }
      });

    const task2 = this.storage.upload(`Images/verso_${currentDate}`, file2);
    task2.snapshotChanges()
      .pipe(finalize(() => {
        this.downloadURL2 = fileRef2.getDownloadURL();
        this.downloadURL2.subscribe(downloadURL2 => {
          if (downloadURL2) {
            this.fichesClientsService.addFicheClient(ficheClient);
            this.showSuccesfulUploadAlert();
          }
          console.log(downloadURL2);
        });
      }))
      .subscribe(url => {
        if (url) {
          console.log(url);
        }
      });
  }

  async showSuccesfulUploadAlert() {
    const alert = await this.alertCtrl.create({
      cssClass: 'basic-alert',
      header: 'Succès',
      message: "Vos informations ont été enregistrées, vous pouvez vous rendre à l'espace rachat.",
      buttons: ['OK']
    });

    await alert.present();
  }

  base64ToImage(dataURI) {
    const fileDate = dataURI.split(',');
    // const mime = fileDate[0].match(/:(.*?);/)[1];
    const byteString = atob(fileDate[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const int8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      int8Array[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([arrayBuffer], {
      type: 'image/png'
    });
    return blob;
  }


  remove(item: any) {
    this.fichesClientsService.removeFicheClient(item.id);
  }

  changeViewTo0() {
    this.chartView = 0;
    setTimeout(() => {
      this.barChartMethod();
    }, 100)
  }

  changeViewTo1() {
    this.chartView = 1;
    setTimeout(() => {

    }, 100)
  }

  changeViewTo2() {
    this.chartView = 2;
    setTimeout(() => {
      this.lineChartMethod();
    }, 100)
  }

  formatFireBaseDateToWeekNumber(date: any) {
    return weekNumber(new Date(
      date.seconds * 1000 + date.nanoseconds / 1000000,
    ));
  }

  formatFireBaseDateToShow(date: any) {
    const fireBaseTime = new Date(
      date.seconds * 1000 + date.nanoseconds / 1000000,
    );

    return fireBaseTime.toLocaleDateString();
  }

  barChartMethod() {

    var lineData = [0, 0, 0, 0, 0, 0, 0];
    var nonVendu = [0, 0, 0, 0, 0, 0, 0];
    for (var i = 0; i < this.fichesClients.length; i++) {
      var start = this.fichesClients[i].start;
      var vente = this.fichesClients[i].conclude;

      const fireBaseTime = new Date(
        start.seconds * 1000 + start.nanoseconds / 1000000,
      );

      if (this.numberOfWeek === weekNumber(fireBaseTime)) {
        if (vente === true) {
          if (fireBaseTime.getDay() === 1) {
            lineData[0]++;
          } else if (fireBaseTime.getDay() === 2) {
            lineData[1]++;
          } else if (fireBaseTime.getDay() === 3) {
            lineData[2]++;
          } else if (fireBaseTime.getDay() === 4) {
            lineData[3]++;
          } else if (fireBaseTime.getDay() === 5) {
            lineData[4]++;
          } else if (fireBaseTime.getDay() === 6) {
            lineData[5]++;
          } else if (fireBaseTime.getDay() === 0) {
            lineData[6]++;
          }
        }else if(vente === false){
          if (fireBaseTime.getDay() === 1) {
            nonVendu[0]++;
          } else if (fireBaseTime.getDay() === 2) {
            nonVendu[1]++;
          } else if (fireBaseTime.getDay() === 3) {
            nonVendu[2]++;
          } else if (fireBaseTime.getDay() === 4) {
            nonVendu[3]++;
          } else if (fireBaseTime.getDay() === 5) {
            nonVendu[4]++;
          } else if (fireBaseTime.getDay() === 6) {
            nonVendu[5]++;
          } else if (fireBaseTime.getDay() === 0) {
            nonVendu[6]++;
          }
        }
      }
    }

    this.barChart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
        datasets: [{
          label: 'Vente conclue',
          data: lineData,
          backgroundColor: [
            'rgba(75, 192, 192, 0.2)',
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
          ],
          borderWidth: 1
        }, {
          label:"Vente non conclue", 
          data: nonVendu,
          borderWidth: 1,
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',       
          ],
          borderColor: [
            'rgba(255,99,132,1)',
          ],
        }]
      },
      options: {
        scales: {
          yAxes: {
            beginAtZero: true,
            suggestedMax: 10
          }
        }
      }
    });
  }

  weekBack() {
    if (this.numberOfWeek > 1) {
      this.numberOfWeek--;
      if (this.chartView === 2) {
        this.lineChart.destroy();
        this.lineChartMethod();
      }

      if (this.chartView === 0) {
        this.barChart.destroy();
        this.barChartMethod();
      }
    }
  }

  weekForward() {
    if (this.numberOfWeek < 53) {
      this.numberOfWeek++;
      if (this.chartView === 2) {
        this.lineChart.destroy();
        this.lineChartMethod();
      }

      if (this.chartView === 0) {
        this.barChart.destroy();
        this.barChartMethod();
      }
    }
  }


  lineChartMethod() {
    var lineData = [0, 0, 0, 0, 0, 0, 0];
    for (var i = 0; i < this.fichesClients.length; i++) {
      var start = this.fichesClients[i].start;

      const fireBaseTime = new Date(
        start.seconds * 1000 + start.nanoseconds / 1000000,
      );

      if (this.numberOfWeek === weekNumber(fireBaseTime)) {
        if (fireBaseTime.getDay() === 1) {
          lineData[0]++;
        } else if (fireBaseTime.getDay() === 2) {
          lineData[1]++;
        } else if (fireBaseTime.getDay() === 3) {
          lineData[2]++;
        } else if (fireBaseTime.getDay() === 4) {
          lineData[3]++;
        } else if (fireBaseTime.getDay() === 5) {
          lineData[4]++;
        } else if (fireBaseTime.getDay() === 6) {
          lineData[5]++;
        } else if (fireBaseTime.getDay() === 0) {
          lineData[6]++;
        }
      }


      // console.log({
      //   type: "CONSOLE DATE LINE CHART",
      //   date: fireBaseTime,
      //   weekNumber: weekNumber(fireBaseTime)
      // })
    }

    // console.log(this.numberOfWeek)

    this.lineChart = new Chart(this.lineCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
        datasets: [{
          label: 'Client venu pour vendre',
          fill: false,
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
          borderCapStyle: 'butt',
          borderDash: [],
          borderDashOffset: 0.0,
          borderJoinStyle: 'miter',
          pointBorderColor: 'rgba(75,192,192,1)',
          pointBackgroundColor: '#fff',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: 'rgba(75,192,192,1)',
          pointHoverBorderColor: 'rgba(220,220,220,1)',
          pointHoverBorderWidth: 2,
          pointRadius: 1,
          pointHitRadius: 10,
          data: lineData,
          spanGaps: false,
        }]
      },
      options: {
        scales: {
          yAxes: {
            beginAtZero: true,
            suggestedMax: 10
          }
        }
      }
    });
  }

}
