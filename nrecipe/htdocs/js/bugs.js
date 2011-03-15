var selectedRecord;
var editWindow;
var oper;
var storeLoaded = false;
var notNull = function (val) {
  return val ? val : '';
};

Ext.onReady(function(){
    var body = Ext.getBody();

    var Record = Ext.data.Record.create([
	{name: 'id',      mapping: 0, type: 'int', sortType: notNull},
	{name: 'name',    mapping: 1, sortType: notNull},
	{name: 'type',    mapping: 2, sortType: notNull},
        {name: 'description', mapping: 3, sortType: notNull},
        {name: 'create_date', mapping: 4, sortType: notNull}
    ]);

    var reader = new Ext.data.JsonReader(
	{
	    root: 'rows',
	    totalProperty: 'totalcount',
	    id: 'id'
	}, Record
    );

    var store = new Ext.data.Store({
	proxy: new Ext.data.HttpProxy({
	    api: {
		read: '/recipe/admin/bugs/list'
	    },
	    method : 'post'
	}),
	reader: reader,
	remoteSort: true,
	listeners: {
	    exception: failure_store
	},
	sortInfo: {
	    field: 'id',
	    direction: 'ASC'
	}
    });

    var editWindow = bugWindowFactory({
	getSelected: function(){
	    return selectedRecord;
	},
	loadStore:loadStore
    });
    var addButton = new Ext.Button({
	text: 'New bug',
	listeners: {
	    click: function(){
		editWindow.openAdd();
	    }
	}
    });

    function doEdit() {
	if (selectedRecord) {
	    editWindow.openEdit();
	}
    };

    var editButton = new Ext.Button({
	text: 'Edit bug',
	disabled: true,
	listeners: {
	    click: doEdit
	}
    });

    var deleteButton = new Ext.Button({
	text: 'Delete',
	disabled: true
    });

    deleteButton.on('click', function(){
	if (selectedRecord) {
	    Ext.Ajax.request({
		url: '/recipe/admin/bugs/delete',
		success: function(response,options){
		    if (success_ajax(response,options))
			loadStore();
		},
		failure: failure_ajax,
		params: { id: selectedRecord.data.id }
	    });
	}
	clearSelection();
    });

    function clearSelection() {
	if (grid) {
	    grid.getSelectionModel().clearSelections();
	    grid.getSelectionModel().fireEvent('rowdeselect');
	}
	selectedRecord          = null;
    }

    var pagingBar = new Ext.StatefulPagingToolbar ({
        store: store,
        pageSize: 50,
        emptyMsg: 'no data to display',
        displayInfo: true,
        prependButtons: true,
        stateId: 'paging_toolbarbugs',
        stateful: true,
        stateEvents: ['change','select'],
        listeners: {
            staterestore:
            function(){
                store.setBaseParam('start',this.cursor);
                loadStore();
            },
            //handles selects from the filterCombo
            select: function(){
                this.cursor = 0;
            }
        },
	items: [
	    '<a href="/recipe/index.html">Back to menu</a>',
	    '-',
	    addButton,
	    '-',
	    editButton,
	    '-',
	    deleteButton,
	    '-',
	    '->',
	    '-',
	    'Bug tracker',
	    '-'
	]
    });

    function loadStore() {
	storeLoaded = false;
	store.load({
	    callback: function() {
		storeLoaded = true;
	    }
	});
    }

    var model = new Ext.grid.ColumnModel({
	columns: [{
	    header   : 'Name',
	    width    : 72,
	    dataIndex: 'name',
	    sortable : true
	},{
	    header   : 'Type',
	    width    : 72,
	    dataIndex: 'type',
	    sortable : true
	},{
	    header   : 'Description',
	    width    : 160,
	    dataIndex: 'description',
	    sortable : false
	},{
	    header   : 'Created',
	    width    : 160,
	    dataIndex: 'create_date',
	    sortable : true
	}],
	defaults: {
	    renderer: 'htmlEncode'
	}
    });

     var gridSelectionModel = new Ext.grid.RowSelectionModel({
	singleSelect: true,
	listeners: {
	    rowdeselect: function (sm, rowIndex, r) {
		selectedRecord = null;
		deleteButton.disable();
		editButton.disable();
	    },
	    rowselect: function (sm, rowIndex, r) {
		selectedRecord = r;
		if (selectedRecord) {
		    deleteButton.enable();
		    editButton.enable();
		}
	    }
	}
    });

    var grid = new Ext.grid.GridPanel({
	store: store,
	sm: gridSelectionModel,
	cm: model,
	region: 'center',
	stripeRows: true,
	enableHdMenu: false,
	tbar: pagingBar,
	enableColumnHide : false,
	stateful   : true,
	stateId    : 'bugsGridState',

	listeners: {
	    rowdblclick: doEdit
	},
	viewConfig: {
	    forceFit: true,
	    getRowClass: function(record, rowIndex, rp, ds){
		    return 'foo';
	    },
	    templates: {
		cell: new Ext.Template(
		    '<td class="x-grid3-col x-grid3-cell x-grid3-td-{id} '+
                        'x-selectable {css}" style="{style}" '+
                        'tabIndex="0" {cellAttr}>',
		    '<div class="x-grid3-cell-inner x-grid3-col-{id}" '+
                        '{attr}>{value}</div>',
		    '</td>'
		)
	    }
	}
    });
    loadStore();
    var viewport = new Ext.Viewport({
	layout: 'border',
	autoHeight: true,
	autoWidth: true,
	renderTo: body,
	items: [grid]
    });
    viewport.render();
});