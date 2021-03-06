var goods = {
    'skus': {},

    'events': function(){
        $('#sku-table-container').on('blur', '.sku-quantity', function(){
            goods.getTotalNum();
        }).on('change', '.cp-alias', function(){
            //@todo 对应sku表格描述也要改
        });
    },
    'thumbnail': function(){
        //设置缩略图
        system.getScript(system.assets('faycms/js/admin/uploader.js'), function(){
            uploader.image({
                'cat': 'goods'
            });
        });
    },
    'gallery': function(){
        //图集
        system.getScript(system.assets('faycms/js/admin/uploader.js'), function(){
            uploader.files({
                'cat': 'goods',
                'image_only': true
            });
        });
    },
    'sku':function(){
        //销售属性选中
        $(".sku-item [type='checkbox']").click(function(){
            if($(this).attr("checked")){
                $(this).next("label").hide();
                $(this).siblings("input[type='text']").removeClass('fn-hide');
            }else{
                $(this).next("label").show();
                $(this).siblings("input[type='text']").addClass('fn-hide');
            }
            goods.showSkuTable();
            goods.getTotalNum();
        });
    },
    'props': function(){
        //普通属性选中
        //复选框
        $(".goods-prop-box [type='checkbox']").click(function(){
            if($(this).attr("checked")){
                $(this).next("label").hide();
                $(this).siblings("input[type='text']").removeClass('fn-hide');
            }else{
                $(this).next("label").show();
                $(this).siblings("input[type='text']").addClass('fn-hide');
            }
        });

        //单选框
        $(".goods-prop-box [type='radio']").click(function(){
            var name = $(this).attr("name");
            $(".goods-prop-box [name='"+name+"']").each(function(){
                if($(this).attr("checked")){
                    $(this).next("label").hide();
                    $(this).siblings("input[type='text']").removeClass('fn-hide');
                }else{
                    $(this).next("label").show();
                    $(this).siblings("input[type='text']").addClass('fn-hide');
                }
            });
        });
    },
    'getTotalNum': function(){
        if($(".sku-quantity").size()){
            //计算宝贝总数
            var total_num = 0;
            $(".sku-quantity").each(function(){
                total_num += $(this).val() ? parseInt($(this).val()) : 0;
            });
            $("#sku-total-num").val(total_num);
            $("#sku-total-num").attr("readonly", "readonly");
        }else{
            $("#sku-total-num").removeAttr("readonly");
        }
    },
    'showSkuTable': function(){
        //清除原来的表格
        $('#sku-table-container').html('');
        
        //获取所有选中的sku属性
        var showTable = true;//若有一个sku属性还没选值，则不显示表格
        var props = [];//用于记录sku属性的属性及其对应的值
        $('#box-sku .sku-group').each(function(i){
            var pid = $(this).attr("data-pid");
            var name = $(this).attr("data-name");
            var $checked = $(this).find('input[name="cp_sale['+pid+'][]"]:checked');
            var values = [];//选中的属性值
            if(!$checked.length){
                //有一个sku属性未选择，停止循环，不显示表格
                showTable = false;
                return false;
            }
            
            $checked.each(function(){
                values.push({
                    'id': $(this).val(),
                    'alias': $(this).siblings("input[type='text']").val()
                });
            });
            
            props.push({
                'rowspan': 1,
                'id': pid,
                'name': name,
                'values': values
            });
        });
        
        if(!showTable || !props.length){
            //有sku属性未选中，或压根没有sku属性，不显示表格
            return false;
        }
        
        //从后往前循环一遍，计算rowspan
        var rowspan = props[props.length - 1].values.length;
        for(var j = props.length - 2; j >= 0; j--){
            props[j].rowspan = rowspan;
            rowspan *= props[j].values.length;
        }
        
        //绘制表格
        var html = ['<table class="sku-edit-table border-table mt32">',
            '<tr>',
                (function(){
                    //循环所有属性，绘制表头
                    var html = [];
                    for(var i = 0; i < props.length; i++){
                        html.push('<th>'+props[i].name+'</th>');
                    }
                    return html.join('');
                }()),
                '<th>价格</th>',
                '<th>数量</th>',
                '<th>商家编码</th>',
            '</tr>',
            (function(){
                //再循环一次所有属性，绘制表
                var html = [];
                var skip = {};
                var path = {};
                for(var i = 0; i < props[0].rowspan * props[0].values.length; i++){
                    html.push('<tr>');
                    for(var j = 0; j < props.length; j++){
                        if(skip[props[j].id]){
                            //还在rowspan中，跳过
                            skip[props[j].id]--;
                        }else{
                            //若未定义跳过（首次循环或者还在rowspan中）
                            skip[props[j].id] = props[j].rowspan - 1;
                            var value_skip = parseInt(i / props[j].rowspan) % props[j].values.length;
                            html.push('<td rowspan="'+props[j].rowspan+'"><span class="cp-alias-map-'+props[j].id+'-'+props[j].values[value_skip].id+'">'+props[j].values[value_skip].alias+'</span></td>');
                            path[props[j].id] = props[j].values[value_skip].id;
                        }
                    }
                    
                    //构造sku键，按照属性id排序，格式为：属性id:属性值id;属性id:属性值id
                    var pathArr = [];
                    for(var key in path){
                        pathArr.push(key + ':' + path[key]);
                    }
                    var skuKey = pathArr.join(';');
                    
                    var price = (goods.skus[skuKey]) ? goods.skus[skuKey].price : '';
                    var quantity = (goods.skus[skuKey]) ? goods.skus[skuKey].quantity : 1;
                    var tsces = (goods.skus[skuKey]) ? goods.skus[skuKey].tsces : '';
                    
                    html.push('<td><input type="text" name="prices['+skuKey+']" value="'+price+'" class="form-control mw100 ib" data-rule="float" data-params="{\'langth\':8,decimal:2}" data-label="sku价格" /></td>');
                    html.push('<td><input type="text" name="quantities['+skuKey+']" value="'+quantity+'" class="form-control mw100 ib sku-quantity" data-rule="int" data-label="sku数量" /></td>');
                    html.push('<td><input type="text" name="tsces['+skuKey+']" value="'+tsces+'" class="form-control mw200 ib" /></td>');
                    html.push('</tr>');
                }
                return html.join('');
            }()),
        '</table>'];
        $('#sku-table-container').html(html.join(''));
    },
    'init': function(){
        this.events();
        this.thumbnail();
        this.gallery();
        this.props();
        this.sku();
        this.showSkuTable();
        this.getTotalNum();
    }
};