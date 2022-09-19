using cdManagementApp as cm from '../db/data-model';

service cm_cdservice @(requires : 'authenticated-user') {
    entity withdrawalCD
                          @(Capabilities : {
                              InsertRestrictions : {Insertable : true},
                              UpdateRestrictions : {Updatable : true},
                              DeleteRestrictions : {Deletable : true}
                          })                  @(restrict : [
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
                          ])
                          as projection on cm.withdrawalCD actions {
        action assignBAA(newBaa : String, newEmail : String);
        action assignDev(newDev : String, newEmail : String);
        action updateCustStatus(newStatus : String);
        action updateWorkStatus(newStatus : String);
    }

    entity status         as projection on cm.status

    @cds.persistence.skip
    // @(Capabilities : {SearchRestrictions : {Searchable : false}})
    entity baaUsers       as projection on cm.users

    @cds.persistence.skip
    // @(Capabilities : {SearchRestrictions : {Searchable : false}})
    entity devUsers       as projection on cm.users

    entity transportreq   as projection on cm.transportreq
    entity cdStatus       as projection on cm.cdStatus
    entity trfunctionText as projection on cm.trfunctionText
    entity categoryText   as projection on cm.categoryText

//test only
// entity testusers      as projection on cm.testusers
}

service APIService @(
                     requires : 'system-user',
                     path     : 'API'
                   ) {
    entity withdrawalCD as projection on cm.withdrawalCD
    entity transportreq as projection on cm.transportreq
    entity categoryText   as projection on cm.categoryText
    action updateCDList(inputcd : many cm.inputCD)
}
