/**
 * 2014.10.23 by Hyeongjin Yong
 * 여러 컬럼의 그룹의 헤더를 표시하는 플러그인
 * 기능 구현만 해 놓은 상태
 * 성능 개선이나 기능(리사이즈, 헤더 버튼 등)을 추가하기 위한 작업이 필요하다.
 *
 * 그리드에서 지원하지 않는 정보에 대한 접근을 위해서 클래스를 사용한 접근이 사용되었다.
 */

(function ($) {
  $.extend(true, window, {
    "Slick": {
      "Plugins": {
        "HeaderGroups": HeaderGroups
      }
    }
  });


  function HeaderGroups(options) {
    var _grid;
    var _self = this;
    var _handler = new Slick.EventHandler();
    var _defaults = {};

    var _groups = [];
    var _columns;
    var _columnsById = {};
    var _columnCount = 0;

    var $groups;
    var $headers;

    /*
     * 그리드 헤더 이벤트 적용을 위해서 컬럼 정의를 다시 설정하기 때문에
     * 그리드 컬럼 정의를 여기서 캡쳐해 두는 것은 의미가 없다.
     */
    function init(grid) {
      options = $.extend(true, {}, _defaults, options);
      _grid = grid;
      _groups = [];
      _columns = _grid.getColumns();

      _handler
        .subscribe(_grid.onHeaderCellRendered, handleHeaderCellRendered)
        .subscribe(_grid.onBeforeHeaderCellDestroy, handleBeforeHeaderCellDestroy)
        .subscribe(_grid.onColumnsResized, onColumnsResized);

      // 이벤트를 적용하기 위해 그리드가 헤더를 다시 그리도록 한다.
      _grid.setColumns(_columns);
    }

    /*
     * 마지막 헤더까지 모두 렌더링된 후에 헤더 그룹을 렌더링한다.
     * 그리드에서 제공하는 이벤트가 없어서 이짓을 한다.
     * 이것이 제대로 동작하지 않으면
     * 이벤트 처리 전에 일정 시간 동안 같은 이벤트가 다시 오지 않으면 처리하도록 할 수 도 있다.
     */
    function handleHeaderCellRendered(e, args) {
      var column = args.column;
      _columnCount++;
      if (_columnCount == _columns.length) {
        renderHeaderGroup();
      }
    }

    function handleBeforeHeaderCellDestroy(e, args) {
      var column = args.column;
      if (column.header && column.header.group) {
        // Removing buttons via jQuery will also clean up any event handlers and data.
        // NOTE: If you attach event handlers directly or using a different framework,
        //       you must also clean them up here to avoid memory leaks.
        // $(args.node).find("." + options.buttonCssClass).remove();
      }
    }

    function onColumnsResized(e, args) {
      $.each(_groups, function(index, group){
        group.setWidth(group.getWidth() - headerColumnWidthDiff);
      });
    }

    function renderHeaderGroup() {
      initColumns();
      var group;
      $.each(_columns, function(index, column){
        if (column.group) {
          group = getGroup(column.group);
          if (!group){
            group = new HeaderGroup();
            group.name = column.group;
            _groups.push(group);
          }
        } else {
          group = new HeaderGroup();
          group.name = '';
          _groups.push(group);
        }
        group.addColumn(column);
      });

      var $headerScroller = $('.slick-header');
      $headers = $('.slick-header-columns', $headerScroller);
      $groups = $( $('.slick-header-column-groups')[0] );
      if ($groups.length < 1) {
        $groups = $("<div class='slick-header-column-groups' style='left:-1000px; height:24px' />").prependTo($headerScroller);
      }

      $groups.empty();
      $groups.width($headers.width());
      measureCellPaddingAndBorder();

      $.each(_groups, function(index, group) {
        var header = $("<div class='ui-state-default slick-header-column-group' />")
            .html("<span class='slick-column-name'>" + group.name + "</span>")
            .width(group.getWidth() - headerColumnWidthDiff)
            //.attr("id", "" + uid + m.id)
            .addClass(group.headerCssClass || "")
            .appendTo($groups);
        group.element = header;
      });
    }

    function getGroup(groupName) {
      var _filterdGroups = $.map(_groups, function(group, index) {
        return group.name == groupName ? group : null;
      });
      return _filterdGroups[0];
    }

    function initColumns() {
      _columns = _grid.getColumns();
      $.each(_columns, function(index, column) {
        _columnsById[column.id] = column;
      });
    }

    function destroy() {
      _handler.unsubscribeAll();
    }

    /* copied from slick.grid.js */
    var headerColumnWidthDiff = headerColumnHeightDiff = 0;
    function measureCellPaddingAndBorder() {
      var el;
      var h = ["borderLeftWidth", "borderRightWidth", "paddingLeft", "paddingRight"];
      var v = ["borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"];

      el = $("<div class='ui-state-default slick-header-column-group' style='visibility:hidden'>-</div>").appendTo($headers);
      headerColumnWidthDiff = headerColumnHeightDiff = 0;
      if (el.css("box-sizing") != "border-box" && el.css("-moz-box-sizing") != "border-box" && el.css("-webkit-box-sizing") != "border-box") {
        $.each(h, function (n, val) {
          headerColumnWidthDiff += parseFloat(el.css(val)) || 0;
        });
        $.each(v, function (n, val) {
          headerColumnHeightDiff += parseFloat(el.css(val)) || 0;
        });
      }
      el.remove();
    }

    $.extend(this, {
      'init' : init,
      'destroy' : destroy
    });
  }

  function HeaderGroup() {
    this.name = '';
    this.length = 0;
    this.columns = [];
    this.element;

    function init(grid) {
    }

    function getColspan() {
      return this.colspan;
    }

    function setWidth(width) {
      $(this.element).width(width);
    }

    function getWidth() {
      var width = 0;
      for(var i=0,l=this.columns.length;i<l;i++){
        width += this.columns[i].width;
      }
      return width;
    }

    function addColumn(column) {
      this.columns.push(column);
      this.length += 1;
    }

    function removeColumn(column) {
      var idx = $.indexOf(column, this.columns);
      if (idx> -1) {
        this.columns.splice(idx, 1);
        this.length -= 1;
      }
    }

    init();

    $.extend(this, {
      'setWidth' : setWidth,
      'getWidth' : getWidth,
      'addColumn' : addColumn,
      'removeColumn' : removeColumn
    })
  }


})(jQuery);
