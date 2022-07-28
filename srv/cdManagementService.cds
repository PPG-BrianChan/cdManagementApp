using cdManagementApp as cm from '../db/data-model';

service cm_cdservice @(requires : 'authenticated-user') {
    entity withdrawalCD @(Capabilities : {
        InsertRestrictions : {Insertable : true},
        UpdateRestrictions : {Updatable : true},
        DeleteRestrictions : {Deletable : true}
    // })
    }, )                @(restrict : [
        {
            grant : '*',
            to    : 'admin'
        },
        {
            grant : [
                'assignDev',
                'updateWorkStatus'
            ],
            to    : 'developer'
        },
        {
            grant : [
                'assignBAA',
                'updateCustStatus'
            ],
            to    : 'baa'
        },
        {grant : 'READ'}
    ])                    as projection on cm.withdrawalCD actions {
        action assignBAA(newBaa : String, newEmail : String);
        action assignDev(newDev : String, newEmail : String);
        action updateCustStatus(newStatus : String);
        action updateWorkStatus(newStatus : String);
    }

    entity status         as projection on cm.status
    entity users          as projection on cm.users
    entity transportreq   as projection on cm.transportreq
    entity cdStatus       as projection on cm.cdStatus
    entity trfunctionText as projection on cm.trfunctionText
}

service APIService @(
    requires : 'system-user',
    path     : 'API'
) {
    entity withdrawalCD as projection on cm.withdrawalCD
    entity transportreq as projection on cm.transportreq
    action updateCDList(inputcd : many cm.inputCD)
}
