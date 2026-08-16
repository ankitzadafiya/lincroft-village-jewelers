import { NgModule } from '@angular/core';
import {
  ArrowRight,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Facebook,
  FileText,
  Heart,
  Inbox,
  Instagram,
  LayoutDashboard,
  LogOut,
  LucideAngularModule,
  MapPin,
  Menu,
  MessageCircle,
  Package,
  Phone,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  Upload,
  User,
  Users,
  X
} from 'lucide-angular';

@NgModule({
  imports: [
    LucideAngularModule.pick({
      ArrowRight,
      ArrowUp,
      ChevronDown,
      ChevronLeft,
      ChevronRight,
      Eye,
      EyeOff,
      Facebook,
      FileText,
      Heart,
      Inbox,
      Instagram,
      LayoutDashboard,
      LogOut,
      MapPin,
      Menu,
      MessageCircle,
      Package,
      Phone,
      Search,
      Settings,
      ShoppingBag,
      Sparkles,
      Store,
      Upload,
      User,
      Users,
      X
    })
  ],
  exports: [LucideAngularModule]
})
export class LvjIconsModule {}
