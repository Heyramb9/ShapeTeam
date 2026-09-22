import platformStore from './platformStore';
class NotificationService { create(organizationId:string,userId:string,type:string,title:string,message:string){const notification={id:platformStore.id('notification'),organizationId,userId,type,title,message,isRead:false,createdAt:platformStore.now()};platformStore.mutate(data=>data.notifications.unshift(notification));return notification} organization(organizationId:string,roles:string[],type:string,title:string,message:string){for(const user of platformStore.read('users').filter(item=>item.organizationId===organizationId&&roles.includes(item.role)))this.create(organizationId,user.id,type,title,message)} }
export const notificationService=new NotificationService();
export default notificationService;
