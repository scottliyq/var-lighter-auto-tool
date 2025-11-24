(function ensureXPathCheckboxChecked() {
    const XPATH = '/html/body/div/div[1]/div[2]/div/div/div[6]/div[2]/button/button';
    const node = document.evaluate(
        XPATH,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
    ).singleNodeValue;

    if (!node) {
        console.warn('未找到 XPath 对应的复选框');
        return false;
    }

    const isChecked = el => {
        if (el.matches?.('input[type="checkbox"]')) {
            return !!el.checked;
        }
        const ariaChecked = el.getAttribute?.('aria-checked');
        if (ariaChecked !== null) {
            return ariaChecked === 'true';
        }
        if (el.tagName === 'BUTTON') {
            const ariaPressed = el.getAttribute('aria-pressed');
            if (ariaPressed !== null) {
                return ariaPressed === 'true';
            }
        }
        const innerCheckbox = el.querySelector?.('input[type="checkbox"]');
        return innerCheckbox ? !!innerCheckbox.checked : el.classList?.contains('checked');
    };

    if (isChecked(node)) {
        console.log('复选框已勾选');
        return true;
    }

    node.click();
    const success = isChecked(node);
    console.log(success ? '已勾选复选框' : '点击后仍未勾选');
    return success;
})();

function hasEthInVirtualList(symbol = 'ETH-PERP') {
    const XPATH = '/html/body/div/div[1]/div[1]/div[3]/div[2]/div/div/svelte-virtual-list-viewport/svelte-virtual-list-contents/svelte-virtual-list-row/div/div[1]/a/span';
    let snapshot;
    try {
        snapshot = document.evaluate(
            XPATH,
            document,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null
        );
    } catch (error) {
        console.warn('解析仓位列表 XPath 失败:', error);
        return false;
    }

    if (!snapshot || snapshot.snapshotLength === 0) {
        console.warn('未找到仓位列表行');
        return false;
    }

    for (let i = 0; i < snapshot.snapshotLength; i++) {
        const span = snapshot.snapshotItem(i);
        const text = span?.textContent?.trim().toUpperCase();
        if (text && text.includes(symbol)) {
            console.log('虚拟列表中包含 ETH-PERP 仓位');
            return true;
        }
    }

    console.log('虚拟列表未检测到 ETH-PERP 仓位');
    return false;
}

hasEthInVirtualList();

function clickTargetButton() {
    const XPATH = '/html/body/div/div[1]/div[2]/div/div/button';
    let button;
    try {
        button = document.evaluate(
            XPATH,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        ).singleNodeValue;
    } catch (error) {
        console.warn('解析按钮 XPath 失败:', error);
        return false;
    }

    if (!button) {
        console.warn('未找到目标按钮');
        return false;
    }

    if (button.disabled) {
        console.warn('目标按钮当前不可用');
        return false;
    }

    button.click();
    console.log('已点击目标按钮');
    return true;
}



function fillTargetTPInput(value) {
    const XPATH = '/html/body/div/div[1]/div[2]/div/div/div[6]/div[4]/div[2]/div[1]/input';
    let input;
    try {
        input = document.evaluate(
            XPATH,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        ).singleNodeValue;
    } catch (error) {
        console.warn('解析输入框 XPath 失败:', error);
        return false;
    }

    if (!input) {
        console.warn('未找到输入框');
        return false;
    }

    if (input.disabled || input.readOnly) {
        console.warn('输入框不可编辑');
        return false;
    }

    input.value = '';
    input.dispatchEvent(new Event('input', {bubbles: true}));
    input.value = value ?? '';
    input.dispatchEvent(new Event('input', {bubbles: true}));
    input.dispatchEvent(new Event('change', {bubbles: true}));
    console.log('已填写输入框:', value);
    return true;
}



function fillTargetSLInput(value) {
    const XPATH = '/html/body/div/div[1]/div[2]/div/div/div[6]/div[5]/div[2]/div[1]/input';
    let input;
    try {
        input = document.evaluate(
            XPATH,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        ).singleNodeValue;
    } catch (error) {
        console.warn('解析输入框 XPath 失败:', error);
        return false;
    }

    if (!input) {
        console.warn('未找到输入框');
        return false;
    }

    if (input.disabled || input.readOnly) {
        console.warn('输入框不可编辑');
        return false;
    }

    input.value = '';
    input.dispatchEvent(new Event('input', {bubbles: true}));
    input.value = value ?? '';
    input.dispatchEvent(new Event('input', {bubbles: true}));
    input.dispatchEvent(new Event('change', {bubbles: true}));
    console.log('已填写止损输入框:', value);
    return true;
}

function fillAmountInput(value) {
    const XPATH = '/html/body/div/div[1]/div[2]/div/div/div[5]/div[1]/div/span/div/div/input';
    let input;
    try {
        input = document.evaluate(
            XPATH,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        ).singleNodeValue;
    } catch (error) {
        console.warn('解析数量输入框 XPath 失败:', error);
        return false;
    }

    if (!input) {
        console.warn('未找到数量输入框');
        return false;
    }

    if (input.disabled || input.readOnly) {
        console.warn('数量输入框不可编辑');
        return false;
    }

    input.value = '';
    input.dispatchEvent(new Event('input', {bubbles: true}));
    input.value = value ?? '';
    input.dispatchEvent(new Event('input', {bubbles: true}));
    input.dispatchEvent(new Event('change', {bubbles: true}));
    console.log('已填写数量输入框:', value);
    return true;
}


fillAmountInput(0.5)


function getLastPrice() {
        lastPriceSelector= '/html/body/div[1]/div[1]/div[2]/div/div[1]/div[1]/div[2]/div/div[2]/div/div[3]/div[2]/div[1]/span'

        if (!lastPriceSelector) {
            console.warn('未配置最新价格选择器');
            return null;
        }

        let priceElement;
        try {
            priceElement = document.evaluate(
                lastPriceSelector,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;
        } catch (error) {
            console.warn('解析最新价格 XPath 失败:', error);
            return null;
        }

        if (!priceElement) {
            console.warn('未找到最新价格元素');
            return null;
        }

        const priceText = priceElement.textContent?.trim();
        if (!priceText) {
            console.warn('价格元素内容为空');
            return null;
        }

        // 移除逗号等格式化字符，提取纯数字
        const cleanPrice = priceText.replace(/[,\s]/g, '');
        const price = parseFloat(cleanPrice);

        if (isNaN(price)) {
            console.warn('无法解析价格:', priceText);
            return null;
        }

        console.log('获取最新价格:', price);
        return price;
    }


    function hasPosInVirtualList4Edgex(symbol = 'ETHUSD') {
        const XPATH = '/html/body/div/div[1]/div[2]/div/div[1]/div[2]/div/div[2]/div/table';
        let table;
        try {
            table = document.evaluate(
                XPATH,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;
        } catch (error) {
            console.warn('解析仓位列表 XPath 失败:', error);
            return false;
        }

        const tableText = table.textContent?.trim().toUpperCase();
        if (!tableText) {
            console.warn('表格内容为空');
            return false;
        }

        const symbolUpper = symbol.toUpperCase();
        if (tableText.includes(symbolUpper)) {
            console.log(`表格中包含 ${symbol} 仓位`);
            return true;
        }

        console.log(`表格未检测到 ${symbol} 仓位`);
        return false;
    }

    hasPosInVirtualList4Edgex('ETHUSD');


    function getSymbolFromUrl() {
        try {
            const url = window.location.href;
            // 支持 /trade/SYMBOL 和 /perpetual/SYMBOL 两种格式
            const match = url.match(/\/(trade|perpetual)\/([^/?&#]+)/);
            if (match && match[2]) {
                const symbol = match[2].toUpperCase();
                console.log('从URL提取交易对:', symbol);
                return symbol;
            }
            console.warn('URL中未找到交易对，使用默认值');
            return 'WRONG';
        } catch (error) {
            console.error('提取交易对失败:', error);
            return 'WRONG';
        }
    }

    getSymbolFromUrl()



    function fillAmountInput(value) {
        const XPATH = '/html/body/div/div[1]/div[2]/div/div[2]/div[2]/div[1]/div[4]/div[1]/div/div/div[1]/input';
        let input;
        try {
            input = document.evaluate(
                XPATH,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;
        } catch (error) {
            console.warn('解析数量输入框 XPath 失败:', error);
            return false;
        }

        if (!input) {
            console.warn('未找到数量输入框');
            return false;
        }

        console.log('找到输入框:', input);
        console.log('当前值:', input.value);

        if (input.disabled || input.readOnly) {
            console.warn('数量输入框不可编辑');
            return false;
        }

        const strValue = String(value);
        
        // 先聚焦输入框
        input.focus();
        
        // 使用原生的 setter 设置值（绕过框架拦截）
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(input, strValue);
        
        // 触发 input 事件通知框架
        const inputEvent = new Event('input', {bubbles: true, cancelable: true});
        input.dispatchEvent(inputEvent);
        
        // 短暂延迟后触发 change 事件
        setTimeout(() => {
            const changeEvent = new Event('change', {bubbles: true, cancelable: true});
            input.dispatchEvent(changeEvent);
            console.log('延迟触发 change 后的值:', input.value);
        }, 100);
        
        console.log('设置后的值:', input.value);
        console.log('已填写数量输入框:', strValue);
        
        return true;
    }

    fillAmountInput(0.03)



    function fillTargetSLInput(value = 2800) {
        const XPATH = '/html/body/div/div[1]/div[2]/div/div[2]/div[2]/div[1]/div[6]/div[1]/div[2]/div[2]/div/div[1]/input';
        let input;
        try {
            input = document.evaluate(
                XPATH,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;
        } catch (error) {
            console.warn('解析止损输入框 XPath 失败:', error);
            return false;
        }

        if (!input) {
            console.warn('未找到止损输入框');
            return false;
        }

        if (input.disabled || input.readOnly) {
            console.warn('止损输入框不可编辑');
            return false;
        }

        const strValue = String(value ?? '');
        
        // 先聚焦输入框
        input.focus();
        
        // 使用原生的 setter 设置值（绕过框架拦截）
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(input, strValue);
        
        // 触发 input 事件通知框架
        const inputEvent = new Event('input', {bubbles: true, cancelable: true});
        input.dispatchEvent(inputEvent);
        
        // 短暂延迟后触发 change 事件
        setTimeout(() => {
            const changeEvent = new Event('change', {bubbles: true, cancelable: true});
            input.dispatchEvent(changeEvent);
        }, 100);
        
        console.log('已填写止损输入框:', strValue);
        return true;
    }

    fillTargetSLInput(value = 2800);


    function hasLimitOrderForSymbol(symbol = 'ETHUSD') {
        const XPATH = '/html/body/div[1]/div[1]/div[2]/div/div[1]/div[2]/div/div[3]/div/table';
        let table;
        try {
            table = document.evaluate(
                XPATH,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;
        } catch (error) {
            console.warn('解析订单表格 XPath 失败:', error);
            return false;
        }

        if (!table) {
            console.warn('未找到订单表格');
            return false;
        }

        // 获取表格中的所有行
        const rows = table.querySelectorAll('tbody tr');
        if (!rows || rows.length === 0) {
            console.log('表格中没有数据行');
            return false;
        }

        const symbolUpper = symbol.toUpperCase();

        // 遍历每一行，检查是否同时包含 symbol 和 "Limit"
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowText = row.textContent?.trim().toUpperCase();
            
            if (rowText && rowText.includes(symbolUpper) && rowText.includes('LIMIT')) {
                console.log(`找到 ${symbol} 的 Limit 订单`);
                return true;
            }
        }

        console.log(`未找到 ${symbol} 的 Limit 订单`);
        return false;
    }

    hasLimitOrderForSymbol('ETHUSD');


    function clickTargetButton2() {
        const XPATH = '/html/body/div[1]/div[1]/div[2]/div/div[1]/div[2]/div/div[1]/button[2]';
        let button;
        try {
            button = document.evaluate(
                XPATH,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;
        } catch (error) {
            console.warn('解析按钮 XPath 失败:', error);
            return false;
        }

        if (!button) {
            console.warn('未找到目标按钮');
            return false;
        }

        if (button.disabled) {
            console.warn('目标按钮当前不可用');
            return false;
        }

        button.click();
        console.log('已点击目标按钮');
        return true;
    }

    clickTargetButton2();


    function ensureShortCheckboxChecked() {
        const checkboxXPath = '/html/body/div/main/div/div/div/div[2]/div/div[3]/div/div[1]/div/div[1]/div[2]/div/div/div[6]/div[1]/div/button';
        if (!checkboxXPath) {
            console.warn('未配置复选框 XPath');
            return false;
        }

        let checkbox;
        try {
            checkbox = document.evaluate(
                checkboxXPath,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;
        } catch (error) {
            console.warn('解析shortCheckboxXPath失败:', error);
            return false;
        }

        if (!checkbox) {
            console.warn('未找到开空仓所需的复选框');
            return false;
        }

        const isChecked = el => {
            if (!el) {
                return false;
            }
            if (el.matches?.('input[type="checkbox"]')) {
                return !!el.checked;
            }
            const ariaChecked = el.getAttribute?.('aria-checked');
            if (ariaChecked !== null) {
                return ariaChecked === 'true';
            }
            if (el.tagName === 'BUTTON') {
                const ariaPressed = el.getAttribute('aria-pressed');
                if (ariaPressed !== null) {
                    return ariaPressed === 'true';
                }
            }
            const innerCheckbox = el.querySelector?.('input[type="checkbox"]');
            if (innerCheckbox) {
                return !!innerCheckbox.checked;
            }
            return el.classList?.contains('checked') || el.classList?.contains('is-checked');
        };

        if (isChecked(checkbox)) {
            return true;
        }

        checkbox.click();
        if (isChecked(checkbox)) {
            console.log('已勾选开空仓复选框');
            return true;
        }

        console.warn('尝试勾选开空仓复选框失败');
        return false;
    }

    ensureShortCheckboxChecked();


    function clickShortButton() {
        const XPATH = '/html/body/div/main/div/div/div/div[2]/div/div[3]/div/div[1]/div/div[1]/div[2]/div/div/div[7]/button[1]';
        let button;
        try {
            button = document.evaluate(
                XPATH,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;
        } catch (error) {
            console.warn('解析开空仓按钮 XPath 失败:', error);
            return false;
        }

        if (!button) {
            console.warn('未找到开空仓按钮');
            return false;
        }

        if (button.disabled) {
            console.warn('开空仓按钮当前不可用');
            return false;
        }

        button.click();
        console.log('已点击开空仓按钮');
        return true;
    }


    clickShortButton();


    function hasEthInVirtualList(symbol = 'ETH') {
        const XPATH = '/html/body/div/main/div/div/div/div[2]/div/div[1]/div/div[3]/div/div[1]/div/div/div[2]/div[1]/div[2]/table/tbody';
        let tbody;
        try {
            tbody = document.evaluate(
                XPATH,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;
        } catch (error) {
            console.warn('解析仓位列表 tbody XPath 失败:', error);
            return false;
        }

        if (!tbody) {
            console.warn('未找到仓位列表 tbody');
            return false;
        }

        // 获取所有 tr 行
        const rows = tbody.querySelectorAll('tr');
        if (!rows || rows.length === 0) {
            console.warn('tbody 中没有 tr 行');
            return false;
        }

        const symbolUpper = symbol.toUpperCase();
        
        // 遍历每一行
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            // 获取该行中的所有 td
            const cells = row.querySelectorAll('td');
            
            // 遍历每个单元格
            for (let j = 0; j < cells.length; j++) {
                const cellText = cells[j].textContent?.trim().toUpperCase();
                if (cellText && cellText.includes(symbolUpper)) {
                    console.log(`在 tbody 第${i+1}行第${j+1}列中找到 ${symbol} 仓位`);
                    return true;
                }
            }
        }

        console.log(`tbody 未检测到 ${symbol} 仓位`);
        return false;
    }

    hasEthInVirtualList();