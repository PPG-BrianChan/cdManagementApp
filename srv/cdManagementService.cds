using cdManagementApp as cm from '../db/data-model';

service cm_cdservice {

    @Capabilities.InsertRestrictions.Insertable : true
    @Capabilities.DeleteRestrictions.Deletable  : true
    @Capabilities.UpdateRestrictions.Updatable  : false
    @(restrict : [
        {grant : 'READ'},
        {grant : 'DELETE',to : 'cdManagement_Admin'}
    ])
    entity withdrawalCD as projection on cm.withdrawalCD actions {
        action assignBAA(newBaa : String, newEmail : String);
        action assignDev(newDev : String, newEmail : String);
        action updateCustStatus();
        action updateWorkStatus();
    }

    entity users        as projection on cm.users
    entity transportreq as projection on cm.transportreq
}

service APIService @(
    requires : 'system-user',
    path     : 'API'
) {
    entity withdrawalCD as projection on cm.withdrawalCD
    entity transportreq as projection on cm.transportreq
    action updateCDList(inputcd : many cm.inputCD)
}
