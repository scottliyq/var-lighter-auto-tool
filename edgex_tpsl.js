(function() {
    'use strict';
    
    // 从URL中提取交易对符号
    function getSymbolFromUrl() {
        try {
            const url = window.location.href;
            const match = url.match(/\/trade\/([^/?&#]+)/);
            if (match && match[1]) {
                const symbol = match[1].toUpperCase();
                console.log('从URL提取交易对:', symbol);
                return symbol;
            }
            console.warn('URL中未找到交易对，使用默认值');
            return 'NULL';
        } catch (error) {
            console.error('提取交易对失败:', error);
            return 'NULL';
        }
    }
    
    // 根据symbol自动设置direction
    function getDirectionBySymbol(symbol) {
        const upperSymbol = symbol.toUpperCase();
        if (upperSymbol === 'ETHUSD') {
            console.log('检测到 ETHUSD，设置方向为 LONG');
            return 'SHORT';
        } else if (upperSymbol === 'BTCUSD') {
            console.log('检测到 BTCUSD，设置方向为 SHORT');
            return 'LONG';
        }
        // 默认值
        console.log(`未知交易对 ${symbol}，使用默认方向 SHORT`);
        return 'SHORT';
    }
    
    // 根据symbol自动设置tradeAmount
    function getTradeAmountBySymbol(symbol) {
        const upperSymbol = symbol.toUpperCase();
        if (upperSymbol === 'ETHUSD') {
            console.log('检测到 ETHUSD，设置交易数量为 0.02');
            return '0.02';
        } else if (upperSymbol === 'BTCUSD') {
            console.log('检测到 BTCUSD，设置交易数量为 0.006');
            return '0.006';
        }
        // 默认值
        console.log(`未知交易对 ${symbol}，使用默认交易数量 0.02`);
        return '0.02';
    }
    
    // ========== 参数配置区域 ==========
    const CONFIG = {
        // 执行控制
        isRunning: true,
        iteration: 0,
        direction: null, // 将在下面根据symbol自动设置
        tprate : 0.0015,
        slrate : 0.0015,
        // 交易配置
        symbol: getSymbolFromUrl(),  // 从URL自动获取交易对符号
        tradeAmount: null,        // 将在下面根据symbol自动设置
        targetTPValue: '5',      // 止盈(TP)输入值
        targetSLValue: '5',      // 止损(SL)输入值
        
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
        // submitButtonSelector: 'button[data-testid="submit-button"]',
        shortCheckboxXPath: '/html/body/div/div[1]/div[2]/div/div[2]/div[2]/div[1]/div[6]/div[1]/div[1]/div[1]/button',
        // shortInputXPaths: [
        //     '/html/body/div/div[1]/div[2]/div/div[2]/div[2]/div[1]/div[6]/div[1]/div[2]/div[1]/div/div/div[1]/input',
        //     '/html/body/div/div[1]/div[2]/div/div[2]/div[2]/div[1]/div[6]/div[1]/div[2]/div[2]/div/div[1]/input'
        // ],
        lastPriceSelector: '/html/body/div[1]/div[1]/div[2]/div/div[1]/div[1]/div[2]/div/div[2]/div/div[3]/div[2]/div[1]/span',
        shortInputValue: '6',
        longButtonSelector: '/html/body/div/div[1]/div[2]/div/div[2]/div[2]/div[1]/div[7]/button[1]',
        shortButtonSelector: '/html/body/div/div[1]/div[2]/div/div[2]/div[2]/div[1]/div[7]/button[2]'

    };
    
    // 根据symbol设置direction和tradeAmount
    CONFIG.direction = getDirectionBySymbol(CONFIG.symbol);
    CONFIG.tradeAmount = getTradeAmountBySymbol(CONFIG.symbol);
    console.log(`交易对: ${CONFIG.symbol}, 方向: ${CONFIG.direction}, 交易数量: ${CONFIG.tradeAmount}`);
    
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

    
    // 根据direction配置点击对应的下单按钮
    function clickOrderButton() {
        const isLong = CONFIG.direction === 'LONG';
        const XPATH = isLong ? CONFIG.longButtonSelector : CONFIG.shortButtonSelector;
        const buttonName = isLong ? '做多' : '做空';
        
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
            console.warn(`解析${buttonName}按钮 XPath 失败:`, error);
            return false;
        }

        if (!button) {
            console.warn(`未找到${buttonName}按钮`);
            return false;
        }

        if (button.disabled) {
            console.warn(`${buttonName}按钮当前不可用`);
            return false;
        }

        button.click();
        console.log(`已点击${buttonName}按钮`);
        return true;
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

    function fillTargetTPInput(value = CONFIG.targetTPValue) {
        const XPATH = '/html/body/div/div[1]/div[2]/div/div[2]/div[2]/div[1]/div[6]/div[1]/div[2]/div[1]/div/div/div[1]/input';
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
        
        console.log('已填写止盈输入框:', strValue);
        return true;
    }



    function fillTargetSLInput(value = CONFIG.targetSLValue) {
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

    function getRandomizedAmount() {
        const baseAmount = parseFloat(CONFIG.tradeAmount);
        if (isNaN(baseAmount)) {
            console.warn('tradeAmount 配置无效:', CONFIG.tradeAmount);
            return CONFIG.tradeAmount;
        }

        const randomFactor = 0.9 + Math.random() * 0.2;
        const randomAmount = baseAmount * randomFactor;

        const decimalPlaces = (CONFIG.tradeAmount.toString().split('.')[1] || '').length;
        // 增加2位小数来保留随机性，避免四舍五入回到原值
        const finalAmount = randomAmount.toFixed(Math.max(decimalPlaces + 2, 2));

        console.log(`随机数量: ${finalAmount} (基数: ${CONFIG.tradeAmount}, 系数: ${randomFactor.toFixed(3)})`);
        return finalAmount;
    }

    function getLastPrice() {
        const lastPriceSelector= '/html/body/div[1]/div[1]/div[2]/div/div[1]/div[1]/div[2]/div/div[2]/div/div[3]/div[2]/div[1]/span'

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

    // 通用方法：根据类型(TP/SL)和方向计算目标价格
    function calculateTargetPrice(currentPrice, type = 'TP') {
        if (!currentPrice || isNaN(currentPrice)) {
            console.warn('无效的当前价格:', currentPrice);
            return null;
        }

        const isLong = CONFIG.direction === 'LONG';
        const isTp = type === 'TP';
        const rate = isTp ? CONFIG.tprate : CONFIG.slrate;
        const typeName = isTp ? '止盈' : '止损';

        let targetPrice;
        if (isLong) {
            // 做多：止盈价向上，止损价向下
            targetPrice = isTp ? currentPrice * (1 + rate) : currentPrice * (1 - rate);
        } else {
            // 做空：止盈价向下，止损价向上
            targetPrice = isTp ? currentPrice * (1 - rate) : currentPrice * (1 + rate);
        }

        // 保留与当前价格相同的小数位数
        const decimalPlaces = currentPrice.toString().split('.')[1]?.length || 2;
        const finalPrice = targetPrice.toFixed(decimalPlaces);

        console.log(`计算${typeName}价: ${finalPrice} (方向: ${CONFIG.direction}, 当前价: ${currentPrice}, 比例: ${rate})`);
        return finalPrice;
    }

    // 便捷方法：计算止盈价
    function calculateTargetTpPrice(currentPrice) {
        return calculateTargetPrice(currentPrice, 'TP');
    }

    // 便捷方法：计算止损价
    function calculateTargetSlPrice(currentPrice) {
        return calculateTargetPrice(currentPrice, 'SL');
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

            // const randomAmount = getRandomizedAmount();
            // console.log('准备填充数量:', randomAmount, '类型:', typeof randomAmount);
            const amountFilled = fillAmountInput(CONFIG.tradeAmount);
            if (!amountFilled) {
                retryCount++;
                console.log('数量输入框填充失败，等待后重试开空仓...');
                if (retryCount < CONFIG.shortMaxRetries) {
                    await sleep(CONFIG.waitBeforeRetry);
                }
                continue;
            }
            const lastPrice = getLastPrice();
            console.log('最新价格:', lastPrice);
            if (!lastPrice) {
                retryCount++;
                console.log('获取最新价格失败，等待后重试开空仓...');
                if (retryCount < CONFIG.shortMaxRetries) {
                    await sleep(CONFIG.waitBeforeRetry);
                }
                continue;
            }
            
            const targetTPPrice = calculateTargetTpPrice(lastPrice);
            const targetSLPrice = calculateTargetSlPrice(lastPrice);
            if (!targetTPPrice || !targetSLPrice) {
                retryCount++;
                console.log('计算止盈止损价格失败，等待后重试开空仓...');
                if (retryCount < CONFIG.shortMaxRetries) {
                    await sleep(CONFIG.waitBeforeRetry);
                }
                continue;
            }
            
            const slFilled = fillTargetSLInput?.(targetSLPrice);
            const tpFilled = slFilled && fillTargetTPInput?.(targetTPPrice);
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
            
            if (!clickOrderButton()) {
                console.log('未找到下单按钮');
                retryCount++;
                if (retryCount < CONFIG.shortMaxRetries) {
                    console.log(`${CONFIG.waitBeforeRetry/1000}秒后重试开仓...`);
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
            
            if (hasPosInVirtualList4Edgex(CONFIG.symbol)) {
                console.log(`[${currentTime}] 检测到现有 ${CONFIG.symbol} 仓位,跳过开仓`);
                console.log(`[${currentTime}] 开始休眠${CONFIG.sleepTime/1000}秒...`);
                await sleep(CONFIG.sleepTime);
                continue;
            }
            
            const shortSuccess = await openShortPosition();
            
            if (shortSuccess) {
                console.log(`[${currentTime}] 开仓成功`);
            } else {
                console.log(`[${currentTime}] 开仓失败，继续执行休眠流程`);
            }
            
            console.log(`[${currentTime}] 开始休眠${CONFIG.sleepTime/1000}秒...`);
            await sleep(CONFIG.sleepTime);
            
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