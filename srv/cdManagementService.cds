using cdManagementApp as cm from '../db/data-model';

service cm_cdservice {

    @Capabilities.InsertRestrictions.Insertable : true
    @Capabilities.UpdateRestrictions.Updatable  : false
    @Capabilities.DeleteRestrictions.Deletable  : true
    entity withdrawalCD as projection on cm.withdrawalCD actions {
            @cds.odata.bindingparameter.name : '_it'
            @Core.OperationAvailable         : _it.assignBaaEnabled
        action     assignBAA(
            @title  :                          '{i18n>newBAA}'
            @Common :                          {
            ValueListWithFixedValues : false,
            ValueList                : {
                Label          : '{i18n>User}',
                CollectionPath : 'users',
                Parameters     : [
                    {
                        $Type             : 'Common.ValueListParameterInOut',
                        ValueListProperty : 'userid',
                        LocalDataProperty : newBaa
                    },
                    {
                        $Type             : 'Common.ValueListParameterDisplayOnly',
                        ValueListProperty : 'fullname'
                    },
                ]
            }
        }
        newBaa : String);
            @(
            Common                          : {SideEffects : {
                $Type          : 'Common.SideEffectsType',
                TargetEntities : [_it],
            }, },
            cds.odata.bindingparameter.name : '_it'
        )
            @Core.OperationAvailable         : _it.assignDevEnabled
        action     assignDev(
            @title  :                          '{i18n>newDev}'
            @Common :                          {
            ValueListWithFixedValues : false,
            ValueList                : {
                Label          : '{i18n>User}',
                CollectionPath : 'users',
                Parameters     : [
                    {
                        $Type             : 'Common.ValueListParameterInOut',
                        ValueListProperty : 'userid',
                        LocalDataProperty : newDev
                    },
                    {
                        $Type             : 'Common.ValueListParameterInOut',
                        ValueListProperty : 'fullname',
                        LocalDataProperty : newEmail
                    },
                ]
            }
        }
        newDev : String,
            @UI.Hidden
            newEmail : String);
            @cds.odata.bindingparameter.name : '_it'
            @Core.OperationAvailable         : _it.updateCustEnabled
            action updateCustStatus();
            @cds.odata.bindingparameter.name : '_it'
            @Core.OperationAvailable         : _it.updateWorkEnabled
            action updateWorkStatus();
        }

    // action -> POST, parameter in application/json
    // function -> GET, parameter in URL
    // bound -> with keys
    // unbound -> general
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
