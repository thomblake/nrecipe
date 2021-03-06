function notNull (val) {
  return val ? val : ''
}

Ext.onReady(function () {
  var body = Ext.getBody()

  var Record = Ext.data.Record.create(
    [ {name: '_id'         , mapping: 0}
    , {name: 'name'       , mapping: 1}
    , {name: 'createDate', mapping: 2}
    ]
  )

  var store = new Ext.data.JsonStore(
    { url: '/nrecipe/lists/list'
    , fields: Record
    , remoteSort: true
    , root: 'rows'
    , totalProperty: 'totalcount'
    , idProperty: '_id'
    , listeners: { exception: failureStore
                 }
    , sortInfo: { field: '_id'
                , direction: 'ASC'
                }
    }
  )

  store.storeLoaded = false

  var editWindow = listWindowFactory(
    { getSelected: function () {
        return store.selectedRecord
      }
    , loadStore:loadStore
    }
  )

  var addButton = new Ext.Button(
    { text: 'New list'
    , listeners:
        { click: function () {
            editWindow.openAdd()
          }
        }
    }
  )

  function doEdit () {
    if (store.selectedRecord) {
      editWindow.openEdit()
    }
  }

  var editButton = new Ext.Button(
    { text: 'Change name'
    , disabled: true
    , listeners: { click: doEdit
                 }
    }
  )

  var deleteButton = new Ext.Button(
    { text: 'Delete'
    , disabled: true
    }
  )

  deleteButton.on('click', function () {
    if (store.selectedRecord) {
      Ext.Ajax.request(
        { url: '/nrecipe/lists/delete'
        , success: function (response,options) {
            if (successAjax(response,options)) {
              loadStore()
            }
          }
        , failure: failureAjax
        , params: { _id: store.selectedRecord.data._id
                  }
        }
      )
    }
    clearSelection()
  } )

  var openButton = new Ext.Button(
    { text: 'Edit list'
    , disabled: true
    }
  )

  var openList = function () {
    if (store.selectedRecord) {
      window.location.href = '/nrecipe/lists/setup/view/'
                           + store.selectedRecord.data._id
    }
  }

  openButton.on('click', openList)

  function clearSelection () {
    if (grid) {
      grid.getSelectionModel().clearSelections()
      grid.getSelectionModel().fireEvent('rowdeselect')
    }
    store.selectedRecord = null
  }

  var pagingBar = new Ext.StatefulPagingToolbar(
    { store: store
    , pageSize: 50
    , emptyMsg: 'no data to display'
    , displayInfo: true
    , prependButtons: true
    , stateId: 'pagingToolbarlists'
    , stateful: true
    , stateEvents: ['change','select']
    , listeners:
        { staterestore: function () {
            store.setBaseParam('start',this.cursor)
            loadStore()
          }
        , select: function () {
            //handles selects from the filterCombo
            this.cursor = 0
          }
        }
    , items:
        [ '<a href="/nrecipe">Back to menu</a>'
        , '-'
        , addButton
        , '-'
        , editButton
        , '-'
        , deleteButton
        , '-'
        , openButton
        , '-'
        , '->'
        , '-'
        , 'List browser'
        , '-'
        ]
    }
  )

  function loadStore () {
    store.storeLoaded = false
    store.load(
      { callback: function () {
        store.storeLoaded = true
        }
      }
    )
  }

  function linkRendererFactory(path,name,extra) {
    extra = extra || ''
    return function (value,metaData,record,rowIndex,colIndex,store) {
      return '<a href="'+path+value+extra+'">'+name+'</a>'
    }
  }

  var model = new Ext.grid.ColumnModel(
    { columns:
        [ { header: 'Id'
          , width  : 36
          , dataIndex: '_id'
          , sortable : true
          }
        , { header   : 'Name'
          , width  : 72
          , dataIndex: 'name'
          , sortable : true
          }
        , { header   : 'Date'
          , width  : 72
          , dataIndex: 'createDate'
          , sortable : true
          }
        , { header   : 'Export'
          , width  : 72
          , dataIndex: 'id'
          , sortable : false
          , renderer : linkRendererFactory( '/recipe/admin/lists/export/list'
                                          , 'export'
                                          , '.txt'
                                          )
          }
        ]
    , defaults: { renderer: 'htmlEncode'
                }
    }
  )

   var gridSelectionModel = new Ext.grid.RowSelectionModel(
    { singleSelect: true
    , listeners:
        { rowdeselect: function (sm,rowIndex,r) {
            store.selectedRecord = null
            deleteButton.disable()
            editButton.disable()
            openButton.disable()
          }
        , rowselect: function (sm,rowIndex,r) {
            store.selectedRecord = r
            if (store.selectedRecord) {
              deleteButton.enable()
              editButton.enable()
              openButton.enable()
            }
          }
        }
    }
  )

  var grid = new Ext.grid.GridPanel(
    { store: store
    , sm: gridSelectionModel
    , cm: model
    , region: 'center'
    , stripeRows: true
    , enableHdMenu: false
    , tbar: pagingBar
    , enableColumnHide : false
    , stateful: true
    , stateId: 'itemGridState'
    , listeners: { rowdblclick: openList
                 }
    , viewConfig:
        { forceFit: true
        , getRowClass: function (record,rowIndex,rp,ds) {
            return 'foo'
          }
        , templates:
            { cell: new Ext.Template
                ( '<td class="x-grid3-col x-grid3-cell x-grid3-td-{id} '
                + 'x-selectable {css}" style="{style}" '
                + 'tabIndex="0" {cellAttr}>'
                , '<div class="x-grid3-cell-inner x-grid3-col-{id}" '
                + '{attr}>{value}</div>'
                , '</td>'
                )
            }
        }
    }
  )

  loadStore()

  var viewport = new Ext.Viewport(
    { layout: 'border'
    , autoHeight: true
    , autoWidth: true
    , renderTo: body
    , items: [grid]
    }
  )

  viewport.render()
} )

function listWindowFactory (config) { with (config) {
  Ext.QuickTips.init()

  var comboRecord = new Ext.data.Record.create(
    [ { name: 'description', mapping: 0 }
    ]
  )

  var unitReader = new Ext.data.JsonReader
    ( { totalProperty: 'totalcount'
      , root: 'rows'
      }
    , comboRecord
    )

  var unitStore = new Ext.data.Store(
    { proxy: new Ext.data.HttpProxy(
        { url: '/recipe/admin/units/list'
        , method : 'post'
        }
      )
    , baseParams: { searchAnywhere: true
                  }
    , listeners: { exception: failureStore
                 }
    , reader: unitReader
    }
  )

  var unitCombo = new AddComboBox(
    { store: unitStore
    , displayField: 'description'
    , valueField: 'description'
    , hiddenName: 'unit'
    , triggerAction: 'query'
    , minChars: 0
    , anchor:'100%'
    , mode:'remote'
    , id: 'unitId'
    , fieldLabel: 'Default units'
    }
  )

  var fieldSet = new Ext.form.FieldSet
    ( { border: false
      , style: { marginTop: '10px'
               , marginBottom: '0px'
               , paddingBottom: '0px'
               }
      , layout: { type: 'form'
                , labelSeparator: ''
                }
      , defaults: { xtype: 'textfield'
                  }
      , items:
          [ { id: '_id'
            , xtype: 'hidden'
            }
          , { id: 'name'
            , anchor: '100%'
            , fieldLabel: 'Name'
            }
          ]
      }
    )

  config = config || {}
  config.width = 550
  config.height = 200
  config.fieldSet = fieldSet
  config.route = 'lists'

  editWindow = genericWindowFactory(config)

  return editWindow
} }
