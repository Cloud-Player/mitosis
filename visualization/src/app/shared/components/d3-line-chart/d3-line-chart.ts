import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import * as d3 from 'd3';
import {Selection} from 'd3-selection';
import {Simulation} from 'mitosis-simulation';
import {filter} from 'rxjs/operators';
import {LayoutChangeTypes, LayoutService} from '../../../shared/services/layout';
import {D3Model} from './models/d3';

@Component({
  selector: 'app-d3-line-chart',
  templateUrl: './d3-line-chart.html',
  styleUrls: ['./d3-line-chart.scss'],
  encapsulation: ViewEncapsulation.None
})
export class D3LineChartComponent implements OnInit, AfterViewInit, OnChanges {
  private margin: {
    top: number,
    right: number,
    bottom: number,
    left: number
  } = {top: 20, right: 20, bottom: 30, left: 40};
  private width;
  private height;
  private svg: Selection<any, any, any, any>;
  private _xScale: any;
  private _yScale: any;
  private isRendering = false;
  private dirty = false;
  private isInitialised = false;

  @Input()
  public models: Array<D3Model>;

  constructor(private el: ElementRef, private layoutService: LayoutService) {
  }

  private tick() {
    if (Simulation.getInstance().getClock().isRunning()) {
      this.update();
    }
  }

  private initD3() {
    const holderEl = this.el.nativeElement.querySelector('.d3-line-chart');

    // number of datapoints
    this._xScale = d3.scaleLinear()
      .domain([-100, 0]) // input
      .range([0, this.width]); // output

    this._yScale = d3.scaleLinear()
      .domain([0, 1]) // input
      .range([this.height, 0]); // output

    this.svg = d3.select(holderEl)
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    this.svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(d3.axisBottom(this._xScale));

    this.svg.append('g')
      .attr('class', 'y axis')
      .call(d3.axisLeft(this._yScale));

    this.svg
      .append('defs')
      .append('clipPath')
      .attr('id', 'pathContainer')
      .append('rect')
      .attr('x', 2)
      .attr('y', -20)
      .attr('width', this.width + this.margin.left + this.margin.right - 60)
      .attr('height', this.height + this.margin.top + this.margin.bottom);

    const pathHolder = this.svg
      .append('g')
      .attr('class', 'path-mask')
      .attr('clip-path', 'url(#pathContainer)')
      .append('g')
      .attr('class', 'path-animation-holder');

    this.models.forEach((model) => {
      pathHolder.append('path')
        .attr('class', `line ${model.getId()}`)
        .attr('stroke', model.getColor());
    });

    this.isInitialised = true;
  }

  private update() {
    if (!this.isInitialised || this.isRendering) {
      return;
    }
    this.isRendering = true;
    let xValues = this.models[0].getValues().map(v => v.x);
    const yValues = this.models[0].getValues().map(v => v.y);

    if (xValues.length > 50) {
      xValues = xValues.slice(xValues.length - 50);
    }

    this._xScale
      .domain([
        Math.max(xValues[xValues.length - 1] - 50, -50),
        xValues[xValues.length - 1]
      ]);

    this._yScale
      .domain([
        0,
        Math.max.apply(null, yValues)
      ]);

    this.svg
      .selectAll('.x.axis')
      .transition()
      .duration(1000)
      .ease(d3.easeLinear)
      .call(d3.axisBottom(this._xScale as any) as any);

    this.svg
      .selectAll('.y.axis')
      .transition()
      .duration(1000)
      .ease(d3.easeLinear)
      .call(d3.axisLeft(this._yScale as any) as any);

    this.models.forEach((model) => {
      let values = model
        .getValues();
      if (values.length > 54) {
        values = values.slice(values.length - 54);
      }
      const line = d3.line()
        .x((d: any, i) => this._xScale(d.x)) // set the x values for the line generator
        .y((d: any) => this._yScale(d.y)) // set the y values for the line generator
        .curve(d3.curveMonotoneX); // apply smoothing to the line

      this.svg.selectAll(`.${model.getId()}`)
        .datum(values) // 10. Binds data to the line// Assign a class for styling
        .attr('d', line as any);
    });

    this.svg.selectAll('.path-animation-holder')
      .attr(
        'transform',
        `translate(${6})`
      )
      .transition()
      .ease(d3.easeLinear)
      .duration(1000)
      .attr(
        'transform',
        `translate(${0})`
      )
      .on('end', () => {
        this.isRendering = false;
        this.tick();
      });
  }

  private resize() {
    this.svg.attr('width', 0);
    this.svg.attr('height', 0);
    setTimeout(() => {
      this.width = this.el.nativeElement.offsetWidth;
      this.height = this.el.nativeElement.offsetHeight;
      this.svg.attr('width', this.width + this.margin.left + this.margin.right);
      this.svg.attr('height', this.height + this.margin.top + this.margin.bottom);
    });
  }

  private isDifferent(previousModels: Array<D3Model>, newModels: Array<D3Model>) {
    if (!previousModels && newModels) {
      return true;
    } else if (previousModels && newModels) {
      const newValues = newModels[0].getValues();
      const previousValues = previousModels[0].getValues();
      const lastNewValue = newValues[newValues.length - 1];
      const lastPreviousValue = previousValues[previousValues.length - 1];
      return lastNewValue && lastPreviousValue && lastNewValue.x !== lastPreviousValue.x;
    } else {
      return false;
    }
  }

  ngOnInit(): void {
    this.layoutService.getObservable()
      .pipe(
        filter(ev => ev.changeType === LayoutChangeTypes.windowSizeChange)
      )
      .subscribe(
        this.resize.bind(this)
      );
  }

  ngAfterViewInit(): void {
    this.width = this.el.nativeElement.offsetWidth;
    this.height = this.el.nativeElement.offsetHeight;
    this.initD3();
    this.tick();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.models.currentValue) {
      this.dirty = this.isDifferent(changes.models.previousValue, changes.models.currentValue);
      if (this.dirty) {
        this.update();
      }
    }
  }
}
