(function() {
    'use strict';
    console.log('=== 脚本开始加载 ===');
    
    function getSymbolFromUrl() {
        try {
            const url = window.location.href;
            
            // 支持 /trade/SYMBOL 和 /perpetual/SYMBOL 两种格式
            const pathMatch = url.match(/\/(trade|perpetual)\/([^/?&#]+)/);
            if (pathMatch && pathMatch[2]) {
                const symbol = pathMatch[2].toUpperCase();
                console.log('从URL路径提取交易对:', symbol);
                return symbol;
            }
            
            // 支持 ?market=ETHUSDT0 格式
            const queryMatch = url.match(/[?&]market=([A-Z]+)USDT\d*/i);
            if (queryMatch && queryMatch[1]) {
                const symbol = queryMatch[1].toUpperCase();
                console.log('从URL查询参数提取交易对:', symbol);
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
            console.log('检测到 ETH，设置交易数量为 0.05');
            return '0.05';
        } else if (upperSymbol === 'BTC') {
            console.log('检测到 BTC，设置交易数量为 0.002');
            return '0.002';
        } else if (upperSymbol === 'SOL') {
            console.log('检测到 SOL，设置交易数量为 0.5');
            return '0.5';
        } else if (upperSymbol === 'HYPE') {
            console.log('检测到 HYPE，设置交易数量为 1');
            return '1';
        } else if (upperSymbol === 'XAUT' || upperSymbol === 'PAXG') {
            console.log(`检测到 ${upperSymbol}，设置交易数量为 0.3`);
            return '0.3';
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
        targetTPValue: '3.2',      // 止盈(TP)输入值
        targetSLValue: '3.2',      // 止损(SL)输入值
        
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
        // shortCheckboxXPath: '/html/body/div[3]/div/div[2]/div[1]/div[1]/form/div[4]/div[2]/div/div[1]/div[2]/button',
        // shortInputXPaths: [
        //     '/html/body/div/div[1]/div[2]/div/div/div[6]/div[4]/div[2]/div[1]/input',
        //     '/html/body/div/div[1]/div[2]/div/div/div[6]/div[5]/div[2]/div[1]/input'
        // ],
        shortInputValue: '6'
    };
    
    // 根据symbol设置tradeAmount
    CONFIG.tradeAmount = getTradeAmountBySymbol(CONFIG.symbol);
    console.log(`=== CONFIG初始化完成 ===`);
    console.log(`交易对: ${CONFIG.symbol}, 交易数量: ${CONFIG.tradeAmount}`);
    console.log(`休眠时间: ${CONFIG.sleepTime/1000}秒`);
    console.log(`是否运行: ${CONFIG.isRunning}`);
    
    // ========== 参数配置结束 ==========
    
    function formatTime(date) {
        return date.toTimeString().split(' ')[0];
    }
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function ensureShortCheckboxChecked() {
        const shortCheckboxXPath= '/html/body/div[3]/div/div[2]/div[1]/div[1]/form/div[4]/div[2]/div/div[1]/div[2]/button';

        if (!shortCheckboxXPath) {
            console.warn('未配置复选框 XPath');
            return false;
        }

        let checkbox;
        try {
            checkbox = document.evaluate(
                shortCheckboxXPath,
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

        // 先聚焦再点击
        console.log('点击复选框...');
        checkbox.focus();
        await sleep(50);
        checkbox.click();
        await sleep(100);
        
        if (isChecked(checkbox)) {
            console.log('已勾选开空仓复选框');
            return true;
        }

        console.warn('尝试勾选开空仓复选框失败');
        return false;
    }

    
    // 查找并点击开空仓按钮
    function clickSubmitButton() {
        const XPATH = '/html/body/div[3]/div/div[2]/div[1]/div[1]/form/div[4]/div[4]/button';
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
        console.log(`检查虚拟列表中是否存在 ${symbol} 仓位...`);
        const XPATH = '/html/body/div[3]/div/div[2]/div[2]/div[2]/div/div[2]/div/div/div/div[1]/div[2]/div/div/div/a/div/div[1]/div[1]';
        let iterator = null;
        try {
            iterator = document.evaluate(
                XPATH,
                document,
                null,
                XPathResult.ORDERED_NODE_ITERATOR_TYPE,
                null
            );
        } catch (error) {
            console.warn('解析仓位列表 XPath 失败:', error);
            return false;
        }

        if (!iterator) {
            console.warn('未找到仓位列表');
            return false;
        }

        const symbolUpper = symbol.toUpperCase();
        let span = iterator.iterateNext();
        
        while (span) {
            const text = span.textContent?.trim().toUpperCase();
            if (text && text.includes(symbolUpper)) {
                console.log(`虚拟列表中包含 ${symbol} 仓位`);
                return true;
            }
            span = iterator.iterateNext();
        }

        console.log(`虚拟列表未检测到 ${symbol} 仓位`);
        return false;
    }

    async function fillTargetTPInput(value = CONFIG.targetTPValue) {
        const XPATH = '/html/body/div[3]/div/div[2]/div[1]/div[1]/form/div[4]/div[2]/div[2]/div[1]/div[2]/div/input';
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

        // 先点击聚焦
        console.log('点击止盈输入框...');
        input.click();
        await sleep(200);
        input.focus();
        input.dispatchEvent(new FocusEvent('focus', {bubbles: true}));
        await sleep(200);
        
        input.value = '';
        input.dispatchEvent(new Event('input', {bubbles: true}));
        await sleep(50);
        
        input.value = value ?? '';
        input.dispatchEvent(new Event('input', {bubbles: true}));
        input.dispatchEvent(new InputEvent('input', {bubbles: true, cancelable: true, data: String(value)}));
        input.dispatchEvent(new Event('change', {bubbles: true}));
        input.dispatchEvent(new KeyboardEvent('keyup', {bubbles: true}));
        await sleep(200);
        
        input.dispatchEvent(new FocusEvent('blur', {bubbles: true}));
        input.blur();
        
        console.log('已填写止盈输入框:', value);
        await sleep(50);
        return true;
    }



    async function fillTargetSLInput(value = CONFIG.targetSLValue) {
        const XPATH = '/html/body/div[3]/div/div[2]/div[1]/div[1]/form/div[4]/div[2]/div[2]/div[2]/div[2]/div/input';
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

        // 先点击聚焦
        console.log('点击止损输入框...');
        input.click();
        await sleep(500);
        input.focus();
        input.dispatchEvent(new FocusEvent('focus', {bubbles: true}));
        await sleep(200);
        
        input.value = '';
        input.dispatchEvent(new Event('input', {bubbles: true}));
        await sleep(50);
        
        input.value = value ?? '';
        input.dispatchEvent(new Event('input', {bubbles: true}));
        input.dispatchEvent(new InputEvent('input', {bubbles: true, cancelable: true, data: String(value)}));
        input.dispatchEvent(new Event('change', {bubbles: true}));
        input.dispatchEvent(new KeyboardEvent('keyup', {bubbles: true}));
        await sleep(300);
        
        input.dispatchEvent(new FocusEvent('blur', {bubbles: true}));
        input.blur();
        
        console.log('已填写止损输入框:', value);
        await sleep(50);
        return true;
    }

    async function fillAmountInput(value) {
        const XPATH = '/html/body/div[3]/div/div[2]/div[1]/div[1]/form/div[4]/div[1]/div[1]/div/input';
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

        // 先点击输入框，模拟用户行为
        console.log('点击数量输入框...');
        input.click();
        await sleep(500);  // 等待点击效果生效
        
        // 触发 focus 事件
        input.focus();
        input.dispatchEvent(new FocusEvent('focus', {bubbles: true}));
        input.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}));
        input.dispatchEvent(new MouseEvent('mouseup', {bubbles: true}));
        await sleep(300);  // 等待聚焦效果生效
        
        // 清空并填写值
        input.value = '';
        input.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));
        input.dispatchEvent(new InputEvent('input', {bubbles: true, cancelable: true}));
        await sleep(50);
        
        input.value = String(value);
        
        // 触发多种输入事件
        input.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));
        input.dispatchEvent(new InputEvent('input', {bubbles: true, cancelable: true, data: String(value)}));
        input.dispatchEvent(new Event('change', {bubbles: true, cancelable: true}));
        input.dispatchEvent(new KeyboardEvent('keyup', {bubbles: true, cancelable: true}));
        await sleep(300);  // 等待输入事件处理完成
        
        // 触发 blur 事件
        input.dispatchEvent(new FocusEvent('blur', {bubbles: true}));
        input.blur();
        
        console.log('已填写数量输入框:', value, '(类型:', typeof value, ')');
        await sleep(300);  // 给页面时间更新按钮状态
        return true;
    }

    function getRandomizedAmount() {
        const baseAmount = parseFloat(CONFIG.tradeAmount);
        // if (isNaN(baseAmount)) {
        //     console.warn('tradeAmount 配置无效:', CONFIG.tradeAmount);
        //     return CONFIG.tradeAmount;
        // }

        // const randomFactor = 0.9 + Math.random() * 0.15;
        // const randomAmount = baseAmount * randomFactor;

        // const decimalPlaces = (CONFIG.tradeAmount.toString().split('.')[1] || '').length;
        // // 增加2位小数来保留随机性，避免四舍五入回到原值
        // const finalAmount = randomAmount.toFixed(Math.max(decimalPlaces + 1, 3));

        // console.log(`随机数量: ${finalAmount} (基数: ${CONFIG.tradeAmount}, 系数: ${randomFactor.toFixed(3)})`);
        return baseAmount;
    }

    // 获取当前交易对名称(带缓存)
    let cachedTradingPair = null;
    let lastPairCheckTime = 0;
    const PAIR_CACHE_DURATION = 60000; // 缓存60秒
    
    function getTradingPair() {
            const now = Date.now();
            if (cachedTradingPair && (now - lastPairCheckTime) < PAIR_CACHE_DURATION) {
                return cachedTradingPair;
            }
            
            const submitButtons = document.querySelectorAll(CONFIG.submitButtonSelector);
            let submitButton = null;
            
            for (let btn of submitButtons) {
                if (btn.textContent.includes(CONFIG.longButtonText) || btn.textContent.includes(CONFIG.shortButtonText)) {
                    submitButton = btn;
                    break;
                }
            }
            
            if (submitButton) {
                const text = submitButton.textContent.trim();
                const pair = text.replace(new RegExp(`[${CONFIG.longButtonText}${CONFIG.shortButtonText}]\\s*`), '');
                cachedTradingPair = pair || '未知交易对';
            } else {
                cachedTradingPair = '未知交易对';
            }
            
            lastPairCheckTime = now;
            return cachedTradingPair;
    }
    
    // 执行开空仓操作（带重试）
    async function openShortPosition() {
        let retryCount = 0;
        
        while (retryCount < CONFIG.shortMaxRetries) {
            console.log(`开始执行开空仓操作... ${retryCount > 0 ? `(第${retryCount + 1}次重试)` : ''}`);

            if (!(await ensureShortCheckboxChecked())) {
                retryCount++;
                if (retryCount < CONFIG.shortMaxRetries) {
                    console.log('复选框未勾选，等待后重试开空仓...');
                    await sleep(CONFIG.waitBeforeRetry);
                }
                continue;
            }

            const randomAmount = getRandomizedAmount();
            console.log('准备填充数量:', randomAmount, '类型:', typeof randomAmount);
            const amountFilled = await fillAmountInput(randomAmount);
            if (!amountFilled) {
                retryCount++;
                console.log('数量输入框填充失败，等待后重试开空仓...');
                if (retryCount < CONFIG.shortMaxRetries) {
                    await sleep(CONFIG.waitBeforeRetry);
                }
                continue;
            }

            const slFilled = await fillTargetSLInput?.();
            const tpFilled = slFilled && await fillTargetTPInput?.();
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
            
            if (!clickSubmitButton()) {
                console.log('未找到开仓按钮');
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
        console.log('=== 自动化交易脚本开始运行 ===');
        console.log(`初始状态 - isRunning: ${CONFIG.isRunning}, iteration: ${CONFIG.iteration}`);
        
        while (CONFIG.isRunning) {
            CONFIG.iteration++;
            console.log(`\n========== 第${CONFIG.iteration}次循环开始 ==========`);
            
            const exactTime = new Date();
            const currentTime = formatTime(exactTime);
            const tradingPair = getTradingPair();
            
            console.log(`[${currentTime}] 第${CONFIG.iteration}次执行 - 开空仓 ${tradingPair}`);
            console.log(`检查是否存在 ${CONFIG.symbol} 仓位...`);
            console.log(`当前交易对: ${CONFIG.symbol}`);
            if (hasEthInVirtualList(CONFIG.symbol)) {
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