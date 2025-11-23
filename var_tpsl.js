(function() {
    'use strict';
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
        // 根据symbol自动设置tradeAmount
    function getTradeAmountBySymbol(symbol) {
        const upperSymbol = symbol.toUpperCase();
        if (upperSymbol === 'ETH') {
            console.log('检测到 ETH，设置交易数量为 0.15');
            return '0.15';
        } else if (upperSymbol === 'BTC') {
            console.log('检测到 BTC，设置交易数量为 0.005');
            return '0.005';
        } else if (upperSymbol === 'SOL') {
            console.log('检测到 SOL，设置交易数量为 3');
            return '3';
        } else if (upperSymbol === 'HYPE') {
            console.log('检测到 HYPE，设置交易数量为 10');
            return '10';
        } else if (upperSymbol === 'XAUT' || upperSymbol === 'PAXG') {
            console.log(`检测到 ${upperSymbol}，设置交易数量为 0.3`);
            return '0.12';
        }
        // 默认值
        console.log(`未知交易对 ${symbol}，使用默认交易数量 0.02`);
        return '0';
    }
    // ========== 参数配置区域 ==========
    const CONFIG = {
        // 执行控制
        isRunning: true,
        iteration: 0,
        
        // 交易配置
        symbol: getSymbolFromUrl(),      // 监控的交易对符号
        tradeAmount: null,       // 将在下面根据symbol自动设置
        targetTPValue: '2',      // 止盈(TP)输入值
        targetSLValue: '2',      // 止损(SL)输入值
        
        // 时间配置
        sleepTime: 20000,        // 每轮循环休眠时间(毫秒) - 6500秒 = 6500000毫秒
        sleepAfterShort: 10000, // 开空仓后休眠时间(毫秒) - 20秒 = 20000毫秒
        waitBeforeRetry: 1000,   // 重试前等待时间(毫秒)
        uiUpdateDelay: 1000,      // UI更新等待时间(毫秒)
        shortInputSettleDelay: 1000, // 填写止盈/止损后等待提交的时间(毫秒)
        
        // 重试配置
        shortMaxRetries: 5,      // 开空仓最大重试次数
        longMaxRetries: 99,      // 开多仓最大重试次数
        
        // 按钮文本配置
        shortButtonText: '卖',   // 开空仓按钮文字
        longButtonText: '买',    // 开多仓按钮文字
        
        // 选择器配置
        submitButtonSelector: 'button[data-testid="submit-button"]',
        shortCheckboxXPath: '/html/body/div/div[1]/div[2]/div/div/div[6]/div[2]/button/button',
        shortInputXPaths: [
            '/html/body/div/div[1]/div[2]/div/div/div[6]/div[4]/div[2]/div[1]/input',
            '/html/body/div/div[1]/div[2]/div/div/div[6]/div[5]/div[2]/div[1]/input'
        ],
        shortInputValue: '6'
    };
    
    // 根据symbol设置tradeAmount
    CONFIG.tradeAmount = getTradeAmountBySymbol(CONFIG.symbol);
    console.log(`交易对: ${CONFIG.symbol}, 交易数量: ${CONFIG.tradeAmount}`);
    
    // ========== 参数配置结束 ==========
    
    function formatTime(date) {
        return date.toTimeString().split(' ')[0];
    }
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function ensureShortCheckboxChecked() {
        if (!CONFIG.shortCheckboxXPath) {
            console.warn('未配置复选框 XPath');
            return false;
        }

        let checkbox;
        try {
            checkbox = document.evaluate(
                CONFIG.shortCheckboxXPath,
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

    
    // 查找并点击开空仓按钮
    function clickShortButton() {
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
    
    
    
    function hasEthInVirtualList(symbol = 'ETH') {
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
                console.log('虚拟列表中包含 ETH 仓位');
                return true;
            }
        }

        console.log('虚拟列表未检测到 ETH 仓位');
        return false;
    }

    function fillTargetTPInput(value = CONFIG.targetTPValue) {
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
            console.warn('解析止盈输入框 XPath 失败:', error);
            return false;
        }

        if (!input) {
            console.warn('未找到止盈输入框');
            return false;
        }

        if (input.disabled || input.readOnly) {
            console.warn('止盈输入框不可编辑');
            return false;
        }

        input.value = '';
        input.dispatchEvent(new Event('input', {bubbles: true}));
        input.value = value ?? '';
        input.dispatchEvent(new Event('input', {bubbles: true}));
        input.dispatchEvent(new Event('change', {bubbles: true}));
        console.log('已填写止盈输入框:', value);
        return true;
    }



    function fillTargetSLInput(value = CONFIG.targetSLValue) {
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
        input.value = String(value);
        input.dispatchEvent(new Event('input', {bubbles: true}));
        input.dispatchEvent(new Event('change', {bubbles: true}));
        console.log('已填写数量输入框:', value, '(类型:', typeof value, ')');
        return true;
    }

    function getRandomizedAmount() {
        const baseAmount = parseFloat(CONFIG.tradeAmount);
        if (isNaN(baseAmount)) {
            console.warn('tradeAmount 配置无效:', CONFIG.tradeAmount);
            return CONFIG.tradeAmount;
        }

        const randomFactor = 0.9 + Math.random() * 0.15;
        const randomAmount = baseAmount * randomFactor;

        const decimalPlaces = (CONFIG.tradeAmount.toString().split('.')[1] || '').length;
        // 增加2位小数来保留随机性，避免四舍五入回到原值
        const finalAmount = randomAmount.toFixed(Math.max(decimalPlaces + 2, 3));

        console.log(`随机数量: ${finalAmount} (基数: ${CONFIG.tradeAmount}, 系数: ${randomFactor.toFixed(3)})`);
        return finalAmount;
    }

    function hasEthInVirtualList() {
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
            if (text && text.includes(CONFIG.symbol)) {
                console.log(`虚拟列表中包含 ${CONFIG.symbol} 仓位`);
                return true;
            }
        }

        console.log(`虚拟列表未检测到 ${CONFIG.symbol} 仓位`);
        return false;
    }

    // 获取当前交易对名称
    function getTradingPair() {
        const submitButtons = Array.from(document.querySelectorAll(CONFIG.submitButtonSelector));
        const submitButton = submitButtons.find(btn => {
            return btn.textContent.includes(CONFIG.longButtonText) || btn.textContent.includes(CONFIG.shortButtonText);
        });
        
        if (submitButton) {
            const text = submitButton.textContent.trim();
            const pair = text.replace(new RegExp(`[${CONFIG.longButtonText}${CONFIG.shortButtonText}]\\s*`), '');
            return pair || '未知交易对';
        }
        return '未知交易对';
    }
    
    // 执行开空仓操作（带重试）
    async function openShortPosition() {
        let retryCount = 0;
        
        while (retryCount < CONFIG.shortMaxRetries) {
            console.log(`开始执行开空仓操作... ${retryCount > 0 ? `(第${retryCount + 1}次重试)` : ''}`);

            if (!ensureShortCheckboxChecked()) {
                retryCount++;
                if (retryCount < CONFIG.shortMaxRetries) {
                    console.log('复选框未勾选，等待后重试开空仓...');
                    await sleep(CONFIG.waitBeforeRetry);
                }
                continue;
            }

            const randomAmount = getRandomizedAmount();
            console.log('准备填充数量:', randomAmount, '类型:', typeof randomAmount);
            const amountFilled = fillAmountInput(randomAmount);
            if (!amountFilled) {
                retryCount++;
                console.log('数量输入框填充失败，等待后重试开空仓...');
                if (retryCount < CONFIG.shortMaxRetries) {
                    await sleep(CONFIG.waitBeforeRetry);
                }
                continue;
            }

            const slFilled = fillTargetSLInput?.();
            const tpFilled = slFilled && fillTargetTPInput?.();
            if (!slFilled || !tpFilled) {
                retryCount++;
                console.log('止盈/止损输入框填充失败，等待后重试开空仓...');
                if (retryCount < CONFIG.shortMaxRetries) {
                    await sleep(CONFIG.waitBeforeRetry);
                }
                continue;
            }

            if (CONFIG.shortInputSettleDelay > 0) {
                console.log(`填写输入框后等待 ${CONFIG.shortInputSettleDelay} 毫秒`);
                await sleep(CONFIG.shortInputSettleDelay);
            }

            // if (!fillShortInputs()) {
            //     retryCount++;
            //     if (retryCount < CONFIG.shortMaxRetries) {
            //         console.log('输入框填充失败，等待后重试开空仓...');
            //         await sleep(CONFIG.waitBeforeRetry);
            //     }
            //     continue;
            // }
            
            if (!clickShortButton()) {
                console.log('未找到开空仓按钮');
                retryCount++;
                if (retryCount < CONFIG.shortMaxRetries) {
                    console.log(`${CONFIG.waitBeforeRetry/1000}秒后重试开空仓...`);
                    await sleep(CONFIG.waitBeforeRetry);
                }
                continue;
            }

            await sleep(CONFIG.uiUpdateDelay);
            
            // if (!clickSubmitButton()) {
            //     console.log('开空仓提交失败');
            //     retryCount++;
            //     if (retryCount < CONFIG.shortMaxRetries) {
            //         console.log(`${CONFIG.waitBeforeRetry/1000}秒后重试开空仓...`);
            //         await sleep(CONFIG.waitBeforeRetry);
            //     }
            //     continue;
            // }
            
            console.log('开空仓操作完成');
            return true;
        }
        
        console.log(`开空仓操作失败，已达到最大重试次数${CONFIG.shortMaxRetries}次`);
        return false;
    }
    
    async function mainLoop() {
        console.log('自动化交易脚本开始运行...');
        
        while (CONFIG.isRunning) {
            CONFIG.iteration++;
            
            const exactTime = new Date();
            const currentTime = formatTime(exactTime);
            const tradingPair = getTradingPair();
            
            console.log(`[${currentTime}] 第${CONFIG.iteration}次执行 - 开空仓 ${tradingPair}`);
            
            if (hasEthInVirtualList()) {
                console.log(`[${currentTime}] 检测到现有 ${CONFIG.symbol} 仓位,跳过开仓`);
                console.log(`[${currentTime}] 开始休眠${CONFIG.sleepTime/1000}秒...`);
                await sleep(CONFIG.sleepTime);
                continue;
            }
            
            const shortSuccess = await openShortPosition();
            
            if (shortSuccess) {
                console.log(`[${currentTime}] 开空仓成功`);
            } else {
                console.log(`[${currentTime}] 开空仓失败，继续执行休眠流程`);
            }
            
            console.log(`[${currentTime}] 开始休眠${CONFIG.sleepTime/1000}秒...`);
            await sleep(CONFIG.sleepTime);
            
            // const afterSleep = new Date();
            // console.log(`[${formatTime(afterSleep)}] 休眠结束，准备开多仓`);
            
            // const longSuccess = await openLongPosition();
            
            // if (longSuccess) {
            //     console.log(`[${formatTime(afterSleep)}] 开多仓成功`);
            // } else {
            //     console.log(`[${formatTime(afterSleep)}] 开多仓失败，继续下一轮循环`);
            // }
        }
    }
    
    // 启动脚本
    mainLoop().catch(error => {
        console.error('脚本运行出错:', error);
    });
    
    // 提供停止方法
    window.stopTrading = function() {
        CONFIG.isRunning = false;
        console.log('交易脚本已停止');
    };
    
    // 提供状态查询方法
    window.getTradingStatus = function() {
        return {
            isRunning: CONFIG.isRunning,
            iteration: CONFIG.iteration,
            tradingPair: getTradingPair(),
            config: {...CONFIG} // 返回配置副本
        };
    };
    
    console.log('自动化交易脚本已启动');
    // console.log('执行逻辑：每分钟整点开空仓 → 休眠100秒 → 开多仓');
    console.log('当前交易对:', getTradingPair());
    console.log('如需停止，请在控制台输入: stopTrading()');
    console.log('查询状态输入: getTradingStatus()');
})();