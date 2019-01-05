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
import {D3Model, ID3Node} from './models/d3';

@Component({
  selector: 'app-d3-directed-graph',
  templateUrl: './d3-directed-graph.html',
  styleUrls: ['./d3-directed-graph.scss'],
  encapsulation: ViewEncapsulation.None
})
export class D3DirectedGraphComponent implements OnInit, AfterViewInit, OnChanges {
  @Input()
  public model: D3Model;

  private margin: {
    top: number,
    right: number,
    bottom: number,
    left: number
  } = {top: 20, right: 20, bottom: 30, left: 40};
  private width;
  private height;
  private svg: Selection<any, any, any, any>;
  private zoomHolder: Selection<any, any, any, any>;
  private simulation: any;
  private zoomHandler: any;
  private nodeColor = '#ccc';

  constructor(private el: ElementRef) {

  }

  private dragstarted(d: any) {
    if (!d3.event.active) {
      this.simulation.alphaTarget(0.3).restart();
    }
    d.fx = d.x;
    d.fy = d.y;
  }

  private dragged(d: any) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  private dragended(d: any) {
    if (!d3.event.active) {
      this.simulation.alphaTarget(0).restart();
    }
    d.fx = null;
    d.fy = null;
  }

  private zoomActions() {
    this.zoomHolder.attr('transform', d3.event.transform);
  }

  private highlightNodes(searchTerm: string) {

    d3.select('.nodes').selectAll('circle')
      .attr('fill', (d: any) => {
        if (searchTerm && searchTerm.length > 0 && d.id.match(searchTerm)) {
          return 'red';
        } else {
          return this.nodeColor;
        }
      });
  }

  private tick() {
    const links = d3.select('.links').selectAll('.link');
    const nodes = d3.select('.nodes').selectAll('.node');

    links
      .attr('x1', (d: any) => {
        return d.source.x;
      })
      .attr('y1', (d: any) => {
        return d.source.y;
      })
      .attr('x2', (d: any) => {
        return d.target.x;
      })
      .attr('y2', (d: any) => {
        return d.target.y;
      });

    nodes
      .attr('transform', (d: any) => {
        return 'translate(' + d.x + ',' + d.y + ')';
      });
  }

  private initD3() {
    const holderEl = this.el.nativeElement.querySelector('.d3-directed-graph');
    holderEl.innerHTML = '';

    this.svg = d3.select(holderEl)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    this.zoomHolder = this.svg
      .append('g')
      .attr('class', 'zoom-holder-el');

    this.simulation = d3.forceSimulation()
      .force('collide',
        d3.forceCollide((d: any) => 100)
          .iterations(2))
      .force('link',
        d3.forceLink()
          .id((d: any) => d.id)
          .distance((d: any) => 10)
          .strength(0.2)
      )
      .force('charge', d3.forceManyBody().strength(-20))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .on('tick', this.tick.bind(this));

    this.zoomHandler = d3.zoom()
      .on('zoom', this.zoomActions.bind(this));

    this.zoomHandler(this.svg);

    this.link = this.zoomHolder.append('g')
      .attr('class', 'links')
      .selectAll('link');

    this.node = this.zoomHolder.append('g')
      .attr('class', 'nodes')
      .selectAll('.node');
  }

  private update() {

    let node = d3.select('.nodes').selectAll('.node');
    node = node.data(this.model.getD3Nodes(), (d: ID3Node) => d.id);

    const nodeHolder = node
      .enter()
      .append('g')
      .attr('class', 'node');

    nodeHolder
      .append('circle')
      .attr('r', (d: any) => {
        return d.size + 5;
      })
      .attr('fill', this.nodeColor);

    nodeHolder
      .call(d3.drag()
        .on('start', this.dragstarted.bind(this))
        .on('drag', this.dragged.bind(this))
        .on('end', this.dragended.bind(this)));

    nodeHolder
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dx', (d: any) => {
        return 0;
      })
      .attr('font-size', (d: any) => {
        let scale = (d.size * 2);
        scale = scale > 32 ? 32 : scale < 10 ? 10 : scale;
        return scale + 'px';
      })
      .attr('dy', '.35em')
      .text((d: any) => {
        return d.id;
      });

    node.exit()
      .remove();

    let link = d3.select('.links').selectAll('.link');
    link = link.data(this.model.getD3Edges());

    link
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke-width', (d: any) => {
        return d.weight;
      });

    link.exit()
      .remove();


    this.simulation
      .nodes(this.model.getD3Nodes());

    this.simulation
      .force('link')
      .links(this.model.getD3Edges());

    if (!node.enter().empty() || !node.exit().empty()) {
      this.simulation.alphaTarget(0.3).restart();
    } else {
      this.simulation.alphaTarget(0).restart();
    }
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.width = this.el.nativeElement.offsetWidth;
    this.height = this.el.nativeElement.offsetHeight;
    this.initD3();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.model.currentValue && this.width) {
      this.update();
    }
  }
}
