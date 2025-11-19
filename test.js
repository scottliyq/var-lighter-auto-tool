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
