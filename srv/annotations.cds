using cm_cdservice as cm from './cdManagementService';

annotate cm.withdrawalCD with {
    cdid          @title     : '{i18n>CDID}';
    cdDesc        @title     : '{i18n>CDDesc}';
    overallStatus @title     : '{i18n>OStatus}';
    baa           @title     : '{i18n>Baa}';
    developer     @title     : '{i18n>Developer}';
    gcm           @title     : '{i18n>GCM}';
    custStatus    @title     : '{i18n>CStatus}';
    workStatus    @title     : '{i18n>WStatus}';
    devEmail      @UI.Hidden : true;
    baaEmail      @UI.Hidden : true;
    gcmEmail      @UI.Hidden : true;
    ID            @UI.Hidden : true;
    createdAt     @UI.Hidden : true;
    createdBy     @UI.Hidden : true;
    modifiedAt    @UI.Hidden : true;
    modifiedBy    @UI.Hidden : true;
}

annotate cm.withdrawalCD with @UI : {
    PresentationVariant : {
        SortOrder      : [{
            Property   : cdid,
            Descending : false,
        }, ],
        Visualizations : ['@UI.LineItem', ],
    },

    HeaderInfo          : {
        TypeName       : '{i18n>CD}',
        TypeNamePlural : '{i18n>CDs}',
        Title          : {Value : cdid},
        Description    : {Value : cdDesc}
    },
    SelectionFields     : [
        cdid,
        gcm,
        baa,
        developer
    ],

    LineItem            : [
        {
            $Type  : 'UI.DataFieldForAction',
            Action : 'cm_cdservice.assignBAA',
            Label  : 'Assign BAA'
        },
        {
            $Type  : 'UI.DataFieldForAction',
            Action : 'cm_cdservice.assignDev',
            Label  : 'Assign Developer'
        },
        {
            $Type  : 'UI.DataFieldForAction',
            Action : 'cm_cdservice.updateCustStatus',
            Label  : 'Update Cust Status'
        },
        {
            $Type  : 'UI.DataFieldForAction',
            Action : 'cm_cdservice.updateWorkStatus',
            Label  : 'Update Work Status'
        },
        {
            $Type : 'UI.DataField',
            Value : cdid
        },
        {
            $Type : 'UI.DataField',
            Value : cdDesc
        },
        {
            $Type : 'UI.DataField',
            Value : gcm
        },
        {
            $Type : 'UI.DataField',
            Value : overallStatus
        },
        {
            $Type : 'UI.DataField',
            Value : baa
        },
        {
            $Type : 'UI.DataField',
            Value : custStatus
        },
        {
            $Type : 'UI.DataField',
            Value : developer
        },
        {
            $Type : 'UI.DataField',
            Value : workStatus
        }
    ],

    Facets              : [
        {
            $Type  : 'UI.ReferenceFacet',
            Label  : '{i18n>PIC}',
            Target : '@UI.FieldGroup#PIC'
        },
        {
            $Type  : 'UI.ReferenceFacet',
            Label  : '{i18n>Admin}',
            Target : '@UI.FieldGroup#Admin'
        },
        {
            $Type  : 'UI.ReferenceFacet',
            Label  : '{i18n>TRList}',
            Target : 'transportlist/@UI.PresentationVariant'
        },
        {
            $Type  : 'UI.ReferenceFacet',
            Label  : '{i18n>CDStatuses}',
            Target : 'chronoStatuses/@UI.PresentationVariant'
        }
    ],

    FieldGroup #Admin   : {Data : [
        {Value : gcm},
        {Value : baa},
        {Value : developer},
        {Value : overallStatus},
    ]},

    FieldGroup #PIC     : {Data : [
        {Value : custStatus},
        {Value : workStatus},
    ]},


};

annotate cm.transportreq with {
    transportnum @title     : '{i18n>TRNum}';
    resp_user    @title     : '{i18n>RespUser}';
    trfunction   @title     : '{i18n>TRFunc}';
    status       @title     : '{i18n>TRStatus}';
    parent_ID    @UI.Hidden : true;
    parent_cdid  @UI.Hidden : true;
    ID           @UI.Hidden : true;
    createdAt    @UI.Hidden : true;
    createdBy    @UI.Hidden : true;
    modifiedAt   @UI.Hidden : true;
    modifiedBy   @UI.Hidden : true;

};

annotate cm.transportreq with
@UI : {
    PresentationVariant : {
        SortOrder      : [{
            Property   : transportnum,
            Descending : false,
        }, ],
        Visualizations : ['@UI.LineItem', ],
    },
    HeaderInfo          : {
        TypeName       : '{i18n>TR}',
        TypeNamePlural : '{i18n>TRs}',
        Title          : {Value : transportnum}
    },

    LineItem            : [
        {
            $Type : 'UI.DataField',
            Value : transportnum
        },
        {
            $Type : 'UI.DataField',
            Value : resp_user
        },
        {
            $Type : 'UI.DataField',
            Value : trfunction
        },
        {
            $Type : 'UI.DataField',
            Value : status
        },
    ],

    Facets              : [{
        $Type  : 'UI.ReferenceFacet',
        Label  : '{i18n>TRInfo}',
        Target : '@UI.FieldGroup#TRInfo'
    }],

    FieldGroup #TRInfo  : {Data : [
        {Value : resp_user},
        {Value : trfunction},
        {Value : status},
    ]},

};

annotate cm.cdStatus with {
    date        @title     : '{i18n>Date}';
    time        @title     : '{i18n>Time}';
    status      @title     : '{i18n>CDStatus}';
    parent_ID   @UI.Hidden : true;
    parent_cdid @UI.Hidden : true;
    ID          @UI.Hidden : true;
    createdAt   @UI.Hidden : true;
    createdBy   @UI.Hidden : true;
    modifiedAt  @UI.Hidden : true;
    modifiedBy  @UI.Hidden : true;
};

annotate cm.cdStatus with
@UI : {
    PresentationVariant  : {
        SortOrder      : [
            {
                Property   : date,
                Descending : false,
            },
            {
                Property   : time,
                Descending : false
            }
        ],
        Visualizations : ['@UI.LineItem', ],
    },
    HeaderInfo           : {
        TypeName       : '{i18n>CDStatus}',
        TypeNamePlural : '{i18n>CDChronoStatuses}'
    },

    LineItem             : [
        {
            $Type : 'UI.DataField',
            Value : date
        },
        {
            $Type : 'UI.DataField',
            Value : time
        },
        {
            $Type : 'UI.DataField',
            Value : status
        },
    ],

    Facets               : [{
        $Type  : 'UI.ReferenceFacet',
        Label  : '{i18n>CDStatus}',
        Target : '@UI.FieldGroup#CDStatus'
    }],

    FieldGroup #CDStatus : {Data : [
        {Value : date},
        {Value : time},
        {Value : status},
    ]},

};

annotate cm_cdservice.withdrawalCD actions {
    @Common                          : {SideEffects : {
        $Type          : 'Common.SideEffectsType',
        TargetEntities : [_it],
    }, }
    @cds.odata.bindingparameter.name : '_it'
    @Core.OperationAvailable         : _it.assignBaaEnabled
    assignBAA(
    @Common                          : {
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
                {
                    $Type             : 'Common.ValueListParameterInOut',
                    ValueListProperty : 'email',
                    LocalDataProperty : newEmail
                }
            ]
        }
    }
    @title                           : '{i18n>newBAA}'
    newBaa,
    @UI.Hidden
    newEmail);
    @Common                          : {SideEffects : {
        $Type          : 'Common.SideEffectsType',
        TargetEntities : [_it],
    }, }
    @cds.odata.bindingparameter.name : '_it'
    @Core.OperationAvailable         : _it.assignDevEnabled
    assignDev(
    @Common                          : {
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
                    $Type             : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'fullname'
                },
                {
                    $Type             : 'Common.ValueListParameterInOut',
                    ValueListProperty : 'email',
                    LocalDataProperty : newEmail
                },
            ]
        }
    }
    @title                           : '{i18n>newDev}'
    newDev,
    @UI.Hidden
    newEmail);

    @Common                          : {SideEffects : {TargetEntities : [_it], }, }
    @cds.odata.bindingparameter.name : '_it'
    @Core.OperationAvailable         : _it.updateCustEnabled
    updateCustStatus(
    @Common                          : {
        ValueListWithFixedValues : true,
        ValueList                : {
            Label          : '{i18n>Statuses}',
            CollectionPath : 'status',
            Parameters     : [{
                $Type             : 'Common.ValueListParameterInOut',
                ValueListProperty : 'status',
                LocalDataProperty : newStatus
            }]
        }
    }
    @title                           : '{i18n>newStatus}'
    newStatus);

    @cds.odata.bindingparameter.name : '_it'
    @Common.SideEffects              : {TargetEntities : ['_it', ], }
    @Core.OperationAvailable         : _it.updateWorkEnabled
    updateWorkStatus(
    @Common                          : {
        ValueListWithFixedValues : true,
        ValueList                : {
            Label          : '{i18n>Statuses}',
            CollectionPath : 'status',
            Parameters     : [{
                $Type             : 'Common.ValueListParameterInOut',
                ValueListProperty : 'status',
                LocalDataProperty : newStatus
            }]
        }
    }
    @title                           : '{i18n>newStatus}'
    newStatus)
}

annotate cm_cdservice.users with {
    userid   @title : '{i18n>Userid}';
    fullname @title : '{i18n>Fullname}';
    email    @title : '{i18n>Email}';
}

annotate cm_cdservice.status with {
    status @title : '{i18n>Status}'
}
