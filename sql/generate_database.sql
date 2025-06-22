/*==============================================================*/
/* DBMS name:      PostgreSQL 9.x                               */
/* Created on:     21.06.2025 16:25:10                          */
/*==============================================================*/


drop index administrator_PK;

drop table administrator;

drop index client_full_name_index;

drop index client_PK;

drop table client;

drop index coach_PK;

drop table coach;

drop index hall_PK;

drop table hall;

drop index owns_FK;

drop index subscription_PK;

drop table subscription;

drop index training_date_index;

drop index conducts_FK;

drop index makes_up_FK;

drop index takes_place_FK;

drop index training_session_PK;

drop table training_session;

drop index trains_FK;

drop index trains2_FK;

drop index trains_PK;

drop table trains;

/*==============================================================*/
/* Table: administrator                                         */
/*==============================================================*/
create table administrator (
   administrator_id     SERIAL               not null,
   administrator_full_name VARCHAR(256)         not null,
   administrator_phone_number VARCHAR(24)          not null,
   administrator_password VARCHAR(256)         not null,
   constraint PK_ADMINISTRATOR primary key (administrator_id)
);

/*==============================================================*/
/* Index: administrator_PK                                      */
/*==============================================================*/
create unique index administrator_PK on administrator (
administrator_id
);

/*==============================================================*/
/* Table: client                                                */
/*==============================================================*/
create table client (
   client_id            SERIAL               not null,
   client_full_name     VARCHAR(256)         not null,
   client_birthday      DATE                 null,
   client_phone_number  VARCHAR(24)          not null,
   client_password      VARCHAR(256)         not null,
   constraint PK_CLIENT primary key (client_id)
);

/*==============================================================*/
/* Index: client_PK                                             */
/*==============================================================*/
create unique index client_PK on client (
client_id
);

/*==============================================================*/
/* Index: client_full_name_index                                */
/*==============================================================*/
create  index client_full_name_index on client (
client_full_name
);

/*==============================================================*/
/* Table: coach                                                 */
/*==============================================================*/
create table coach (
   coach_id             SERIAL               not null,
   coach_full_name      VARCHAR(256)         not null,
   coach_phone_number   VARCHAR(24)          not null,
   coach_specialization VARCHAR(128)         not null,
   coach_password       VARCHAR(256)         not null,
   constraint PK_COACH primary key (coach_id)
);

/*==============================================================*/
/* Index: coach_PK                                              */
/*==============================================================*/
create unique index coach_PK on coach (
coach_id
);

/*==============================================================*/
/* Table: hall                                                  */
/*==============================================================*/
create table hall (
   hall_id              SERIAL               not null,
   hall_category        INT2                 not null,
   constraint PK_HALL primary key (hall_id)
);

comment on column hall.hall_category is
'1 - бассейн
2 - боевых искусств
3 - тренажерный
4 - танцевальный
5 - йоги
6 - аэробики';

/*==============================================================*/
/* Index: hall_PK                                               */
/*==============================================================*/
create unique index hall_PK on hall (
hall_id
);

/*==============================================================*/
/* Table: subscription                                          */
/*==============================================================*/
create table subscription (
   subscription_id      SERIAL               not null,
   client_id            INT4                 not null,
   subscription_purchase_date DATE                 not null,
   subscription_start_date DATE                 null,
   subscription_validity_period INT2                 not null,
   subscription_status  BOOL                 not null,
   subscription_price   DECIMAL(5)           not null,
   constraint PK_SUBSCRIPTION primary key (subscription_id)
);

comment on column subscription.subscription_status is
'0 - истек
1 - активен';

/*==============================================================*/
/* Index: subscription_PK                                       */
/*==============================================================*/
create unique index subscription_PK on subscription (
subscription_id
);

/*==============================================================*/
/* Index: owns_FK                                               */
/*==============================================================*/
create  index owns_FK on subscription (
client_id
);

/*==============================================================*/
/* Table: training_session                                      */
/*==============================================================*/
create table training_session (
   training_session_id  SERIAL               not null,
   hall_id              INT4                 not null,
   administrator_id     INT4                 not null,
   coach_id             INT4                 not null,
   training_session_date DATE                 not null,
   training_session_start_time TIME                 not null,
   training_session_duration INT2                 not null,
   training_session_type BOOL                 not null,
   training_session_max_members INT2                 null,
   constraint PK_TRAINING_SESSION primary key (training_session_id)
);

comment on column training_session.training_session_type is
'0 - индивидуальная
1 - групповая';

/*==============================================================*/
/* Index: training_session_PK                                   */
/*==============================================================*/
create unique index training_session_PK on training_session (
training_session_id
);

/*==============================================================*/
/* Index: takes_place_FK                                        */
/*==============================================================*/
create  index takes_place_FK on training_session (
hall_id
);

/*==============================================================*/
/* Index: makes_up_FK                                           */
/*==============================================================*/
create  index makes_up_FK on training_session (
administrator_id
);

/*==============================================================*/
/* Index: conducts_FK                                           */
/*==============================================================*/
create  index conducts_FK on training_session (
coach_id
);

/*==============================================================*/
/* Index: training_date_index                                   */
/*==============================================================*/
create  index training_date_index on training_session (
training_session_date
);

/*==============================================================*/
/* Table: trains                                                */
/*==============================================================*/
create table trains (
   training_session_id  INT4                 not null,
   client_id            INT4                 not null,
   constraint PK_TRAINS primary key (training_session_id, client_id)
);

/*==============================================================*/
/* Index: trains_PK                                             */
/*==============================================================*/
create unique index trains_PK on trains (
training_session_id,
client_id
);

/*==============================================================*/
/* Index: trains2_FK                                            */
/*==============================================================*/
create  index trains2_FK on trains (
client_id
);

/*==============================================================*/
/* Index: trains_FK                                             */
/*==============================================================*/
create  index trains_FK on trains (
training_session_id
);

alter table subscription
   add constraint FK_SUBSCRIP_OWNS_CLIENT foreign key (client_id)
      references client (client_id)
      on delete restrict on update restrict;

alter table training_session
   add constraint FK_TRAINING_CONDUCTS_COACH foreign key (coach_id)
      references coach (coach_id)
      on delete restrict on update restrict;

alter table training_session
   add constraint FK_TRAINING_MAKES_UP_ADMINIST foreign key (administrator_id)
      references administrator (administrator_id)
      on delete restrict on update restrict;

alter table training_session
   add constraint FK_TRAINING_TAKES_PLA_HALL foreign key (hall_id)
      references hall (hall_id)
      on delete restrict on update restrict;

alter table trains
   add constraint FK_TRAINS_TRAINS_TRAINING foreign key (training_session_id)
      references training_session (training_session_id)
      on delete restrict on update restrict;

alter table trains
   add constraint FK_TRAINS_TRAINS2_CLIENT foreign key (client_id)
      references client (client_id)
      on delete restrict on update restrict;

