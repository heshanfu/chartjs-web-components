import {LitElement,html} from '@polymer/lit-element'
import 'chart.js/dist/Chart.bundle.min.js'
  
declare var Chart
class BaseChart extends LitElement{
    static get properties(){
        return {
            type:String,
            data:Object,
            options:Object
        }
    }
    _firstRendered(){
        window.addEventListener('resize',()=>{
            this.chart.resize()
        })
    }
    observe(obj){
        const {update}=this
        return new Proxy(obj,{
            set(target,prop,val,receiver){
                target[prop]=val
                update()
                return true
            }
        })
    }
    _render(){
        return html`
            <style>
                .chart-size{
                    position: relative; 
                }
                canvas{
                    width:400px;
                    height:400px;
                }
            </style>
            <div class="chart-size">
                <canvas></canvas>
            </div>
        `;
    }
    _didRender(props,changedProps,oldProps){
        const data=typeof props.data==='string'?JSON.parse(props.data):props.data
        const options=typeof props.options==='string'?JSON.parse(props.options):props.options
        if(!this.chart){
            const ctx=this.shadowRoot.querySelector('canvas').getContext('2d')
            this.chart=new Chart(ctx, {
                type: props.type,
                data: data,
                options: options
            });
        }else{
            this.chart.type=props.type
            this.chart.data=data
            this.chart.options=options
            this.chart.update()
        }
        this.chart.data=this.observe(this.chart.data)       
        for(const prop in this.chart.data){
            this.chart.data[prop]=this.observe(this.chart.data[prop])
        }
        const me=this
        class NewArray extends Array {
            constructor(...args){
                super(...args);
                [
                    'push',
                    'pop',
                    'shift',
                    'unshift',
                    'splice',
                    'sort',
                    'reverse'
                ].forEach(method => {
                    this[method]=()=>{
                        const result=super[method](...args)
                        Promise.resolve().then(()=> me.update())
                        return result
                    }
                })
            }
        }
        this.chart.data.datasets.map(dataset=>{
            dataset.data=new NewArray(...dataset.data)
            return this.observe(dataset)
        })
    }
    update=()=>{
        this.chart.update()
    }
    get dataValue(){
        return this.chart.data
    }
    get optionsValue(){
        return this.chart.options
    }
}

customElements.define('base-chart', BaseChart);