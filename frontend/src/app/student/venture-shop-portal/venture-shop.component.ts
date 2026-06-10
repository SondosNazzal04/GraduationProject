import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentPortalService, ShopItem } from '../../services/student-portal.service';
import { StudentSidebarComponent } from '../../shared/student-sidebar/student-sidebar.component';
import { StudentTopbarComponent } from '../../shared/student-topbar/student-topbar.component';
@Component({ selector:'app-venture-shop', standalone:true,
  imports:[CommonModule,FormsModule,StudentSidebarComponent,StudentTopbarComponent],
  templateUrl:'./venture-shop.component.html', styleUrls:['./venture-shop.component.scss'] })
export class VentureShopComponent implements OnInit {
  all=signal<ShopItem[]>([]); cat=signal('all'); avail=signal('all');
  cats=['all','stationery','digital','privileges','vouchers'];
  filtered=computed(()=>{ let a=this.all(); if(this.cat()!=='all')a=a.filter(x=>x.category===this.cat()); if(this.avail()==='available')a=a.filter(x=>x.available); return a; });
  redeemed=signal<string[]>([]);
  constructor(public ps: StudentPortalService) {}
  ngOnInit(){ this.ps.getShopItems().subscribe(s=>this.all.set(s)); }
  canAfford(cost:number):boolean{ return this.ps.profile().venturePoints >= cost; }
  redeem(item:ShopItem):void{ if(this.canAfford(item.cost)&&item.available) this.redeemed.update(r=>[...r,item.id]); }
  isRedeemed(id:string):boolean{ return this.redeemed().includes(id); }
}
