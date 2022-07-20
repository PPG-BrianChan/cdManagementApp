namespace cdManagementApp;

using {
    cuid,
    managed
} from '@sap/cds/common';

entity withdrawalCD : cuid, managed {
    key cdid                      : String;
        cdDesc                    : String;
        overallStatus             : String;
        baa                       : String;
        baaEmail                  : String;
        developer                 : String;
        devEmail                  : String;
        gcm                       : String;
        gcmEmail                  : String;
        custStatus                : String;
        workStatus                : String;
        chronoStatuses            : Composition of many cdStatus
                                        on chronoStatuses.parent = $self; 
        transportlist             : Composition of many transportreq
                                        on transportlist.parent = $self;
        virtual assignBaaEnabled  : Boolean default true;
        virtual assignDevEnabled  : Boolean default true;
        virtual updateCustEnabled : Boolean default true;
        virtual updateWorkEnabled : Boolean default true;
}

entity transportreq : cuid, managed {
    key parent       : Association to withdrawalCD;
    key transportnum : String;
        resp_user    : String;
        trfunction   : String(1);
        status       : String;
}

entity users {
    key userid   : String;
        fullname : String;
        email    : String
}

entity status{
    key status : String
}

entity cdStatus : cuid, managed {
    key parent       : Association to withdrawalCD;
    date             : Date;
    time             : Time;
    status           : String;
}

type inputCD {
    guid                : String;
    guid32              : String;
    object_id           : String;
    created_by          : String;
    process_type        : String(4);
    posting_date        : Date;
    description         : String;
    gcm                 : String;
    gcmEmail            : String;
        chronoStatuses      : many {
        date           : Date;
        time           : Time;
        status         : String;
    };
    tr_links            : many {
        originator_id   : String;
        trorder_number  : String;
        description     : String;
        sys_type        : String;
        sys_client      : String(3);
        cts_id          : String;
        transport_track : String;
        resp_user       : String;
        userEmail       : String;
        trfunction      : String(1);
        status          : String
    };
}
